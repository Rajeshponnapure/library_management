# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import models, database
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# --- 0. CONFIGURATION ---
load_dotenv() 

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Initialize Database Tables
# IMPORTANT: If you changed models.py, delete library.db before running this!
models.Base.metadata.create_all(bind=database.engine)

# --- 1. SETUP LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Logic: Create Default Admin
    db = database.SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == "admin@cbit.edu.in").first()
        if not admin:
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hashed_pw = pwd_context.hash("admin123")
            new_admin = models.User(
                email="admin@cbit.edu.in",
                hashed_password=hashed_pw,
                role="admin",
                full_name="Chief Librarian",
                max_tokens=0 
            )
            db.add(new_admin)
            db.commit()
            print("--- Default Admin Created (admin@cbit.edu.in / admin123) ---")
    finally:
        db.close()
    yield 
    print("Server is shutting down...")

# --- 2. CREATE APP & CORS ---
app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- 3. SECURITY TOOLS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

# --- 4. PYDANTIC MODELS (VALIDATION) ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    registration_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None

# New model for adding books
class BookCreate(BaseModel):
    title: str
    author: str
    acc_no: str
    department: str
    total_copies: int

# ===========================
# === API ENDPOINTS ===
# ===========================

# --- A. AUTH (Signup/Login) ---
@app.post("/signup", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    token_limit = 10 if user.role.lower() == "faculty" else 3
    new_user = models.User(
        email=user.email, hashed_password=pwd_context.hash(user.password),
        full_name=user.full_name, role=user.role.lower(), max_tokens=token_limit, 
        registration_number=user.registration_number, branch=user.branch, year=user.year
    )
    db.add(new_user)
    db.commit()
    return {"message": "Account created successfully"}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.get("/books/search/")
def search_books(query: str, db: Session = Depends(get_db)):
    # 1. Get all matching rows (individual copies)
    raw_books = db.query(models.Book).filter(
        (models.Book.title.contains(query)) |
        (models.Book.author.contains(query)) |
        (models.Book.acc_no.contains(query))
    ).all()

    # 2. Group them by Title + Author
    grouped_books = {}
    
    for book in raw_books:

        # Group ONLY by Title + Author (Ignore spaces/casing)
        clean_title = book.title.strip().lower() if book.title else ""
        clean_author = book.author.strip().lower() if book.author else ""

        # Create a unique key for this book title
        key = (clean_title, clean_author)
        
        if key not in grouped_books:
            grouped_books[key] = {
                "id": book.id, # We keep one ID to allow requesting
                "title": book.title,
                "author": book.author,
                "edition_year": book.edition_year,
                "acc_no": book.acc_no, # Show the first one found
                "total_copies": 0,
                "available_copies": 0
            }
        
        # Increment counts
        grouped_books[key]["total_copies"] += 1
        # Check availability (Handle None/Null safely)
        is_available = (book.available_copies is not None and book.available_copies > 0)
        if book.available_copies > 0:
            grouped_books[key]["available_copies"] += 1
            grouped_books[key]["id"] = book.id # Ensure we point to an available copy
            grouped_books[key]["acc_no"] = book.acc_no

    # 3. Convert dictionary back to a list
    return list(grouped_books.values())
    print(f"   Returning {len(results)} grouped books.")
    return results

# ==========================================
# === NEW: STUDENT/FACULTY REQUEST FLOW ===
# ==========================================

@app.post("/request-book/{book_id}")
def request_book(book_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Check if book exists and has stock
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book or book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Book unavailable or out of stock")

    # 2. Check if user already requested this specific book pending
    existing_req = db.query(models.RentRequest).filter(
        models.RentRequest.user_id == current_user.id,
        models.RentRequest.book_id == book_id,
        models.RentRequest.status == models.RequestStatus.PENDING
    ).first()
    if existing_req:
         raise HTTPException(status_code=400, detail="You already have a pending request for this book")

    # 3. Check Token Limits (Active Loans + Pending Requests)
    active_loans = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id, models.Transaction.return_date == None
    ).count()
    
    pending_requests = db.query(models.RentRequest).filter(
        models.RentRequest.user_id == current_user.id, models.RentRequest.status == models.RequestStatus.PENDING
    ).count()

    if (active_loans + pending_requests) >= current_user.max_tokens:
        raise HTTPException(status_code=400, detail=f"Token limit reached ({current_user.max_tokens} max allowed)")

    # 4. Create Request
    new_request = models.RentRequest(
        user_id=current_user.id,
        book_id=book.id,
        request_date=date.today(),
        status=models.RequestStatus.PENDING
    )
    db.add(new_request)
    db.commit()
    return {"message": "Book request sent successfully. Waiting for admin approval."}


# ==========================================
# === NEW: ADMIN DASHBOARD APIS ===
# ==========================================

# 1. VIEW ALL PENDING REQUESTS
@app.get("/admin/requests/pending")
def get_pending_requests(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    requests = db.query(models.RentRequest).filter(models.RentRequest.status == models.RequestStatus.PENDING).all()
    
    # Format data nicely for frontend
    data = []
    for req in requests:
        data.append({
            "request_id": req.id,
            "user_name": req.user.full_name,
            "user_email": req.user.email,
            "book_title": req.book.title,
            "book_acc_no": req.book.acc_no,
            "request_date": req.request_date
        })
    return data

# 2. APPROVE A REQUEST
@app.post("/admin/requests/{request_id}/approve")
def approve_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    req = db.query(models.RentRequest).filter(models.RentRequest.id == request_id).first()
    if not req or req.status != models.RequestStatus.PENDING:
         raise HTTPException(status_code=404, detail="Pending request not found")

    # Double check stock before final approval
    if req.book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Cannot approve: Book is now out of stock")

    # Create final transaction
    days_allowed = 15 if req.user.role == "student" else 30
    new_txn = models.Transaction(
        user_id=req.user_id,
        book_id=req.book_id,
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=days_allowed)
    )
    
    # Update stock and request status
    req.book.available_copies -= 1
    req.status = models.RequestStatus.APPROVED
    
    db.add(new_txn)
    db.commit()
    return {"message": f"Request approved. Book issued to {req.user.full_name}"}

# 3. REJECT A REQUEST
@app.post("/admin/requests/{request_id}/reject")
def reject_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    req = db.query(models.RentRequest).filter(models.RentRequest.id == request_id).first()
    if not req or req.status != models.RequestStatus.PENDING:
         raise HTTPException(status_code=404, detail="Pending request not found")

    req.status = models.RequestStatus.REJECTED
    db.commit()
    return {"message": "Request rejected"}


# ==========================================
# === NEW: ADMIN BOOK MANAGEMENT ===
# ==========================================

@app.post("/admin/books/add")
def add_new_book(book: BookCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    if db.query(models.Book).filter(models.Book.acc_no == book.acc_no).first():
        raise HTTPException(status_code=400, detail="Accession Number already exists")

    new_book = models.Book(
        title=book.title, author=book.author, acc_no=book.acc_no,
        department=book.department, total_copies=book.total_copies, available_copies=book.total_copies
    )
    db.add(new_book)
    db.commit()
    return {"message": f"Book '{book.title}' added successfully"}

@app.delete("/admin/books/delete/{acc_no}")
def delete_book(acc_no: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    book = db.query(models.Book).filter(models.Book.acc_no == acc_no).first()
    if not book: raise HTTPException(status_code=404, detail="Book not found")
    
    #Prevent deleting books that are currently issued or have pending requests
    active_txns = db.query(models.Transaction).filter(models.Transaction.book_id == book.id, models.Transaction.return_date == None).count()
    pending_reqs = db.query(models.RentRequest).filter(models.RentRequest.book_id == book.id, models.RentRequest.status == models.RequestStatus.PENDING).count()

    if active_txns > 0 or pending_reqs > 0:
         raise HTTPException(status_code=400, detail="Cannot delete book while it is issued or has pending requests.")

    db.delete(book)
    db.commit()
    return {"message": f"Book {acc_no} deleted successfully"}

# --- KEEPING PROFILE & RETURN APIS (for now) ---
@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ... (Same logic as before for fetching active loans) ...
    # (I've omitted the detailed body to save space, but it's the same logic as the previous main.py for this function)
    active_issues = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id, models.Transaction.return_date == None).all()
    my_books = []
    for txn in active_issues:
        fine = 0.0
        if date.today() > txn.due_date and current_user.role == "student":
             fine = (date.today() - txn.due_date).days * 5.0
        my_books.append({"title": txn.book.title, "acc_no": txn.book.acc_no, "issue_date": txn.issue_date, "due_date": txn.due_date, "fine_est": fine})
    return {"full_name": current_user.full_name, "email": current_user.email, "role": current_user.role, "tokens_total": current_user.max_tokens, "tokens_used": len(active_issues), "active_loans": my_books}

@app.post("/return-book/")
def return_book(transaction_id: int, db: Session = Depends(get_db)):
    # (This logic remains similar, updating stock back up)
    txn = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not txn or txn.return_date: raise HTTPException(status_code=400, detail="Invalid txn")
    
    txn.return_date = date.today()
    txn.book.available_copies += 1
    db.commit()
    return {"message": "Book returned"}