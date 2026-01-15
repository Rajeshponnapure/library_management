# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # --- NEW IMPORT ---
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta,datetime
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional, List
from jose import jwt, JWTError
import models, database
import os
import shutil # --- NEW IMPORT for saving files ---
from dotenv import load_dotenv
import time

# --- SETUP ---
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# --- NEW: SETUP UPLOADS DIRECTORY ---
UPLOAD_DIR = "uploads"
# Create dir if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
# Mount it so files can be accessed via http://localhost:8000/uploads/filename.jpg
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

# Allow both localhost variations
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AUTH HELPERS ---
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        # FIX IS HERE: Removed 'database.' prefix
        expire = datetime.now() + timedelta(minutes=60) 
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

# --- SCHEMAS ---
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    mobile_number: str
    registration_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None

# NOTE: UserUpdate is still used for text updates
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    registration_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    mobile_number: Optional[str] = None
    # photo_url is removed here, handled by dedicated endpoint

class LoginRequest(BaseModel):
    email: str
    password: str

class IssueRequest(BaseModel):
    student_email: str
    book_acc_no: str

# --- ENDPOINTS ---

@app.post("/signup", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # --- SECURITY: RESTRICT TO COLLEGE DOMAIN ---
    ALLOWED_DOMAIN = "@cbit.edu.in"  # <--- Update this if needed
    
    if not user.email.endswith(ALLOWED_DOMAIN):
        raise HTTPException(
            status_code=400, 
            detail=f"Restricted Access: Only {ALLOWED_DOMAIN} emails are allowed."
        )
    # ---------------------------------------------
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    token_limit = 10 if user.role.lower() == "faculty" else 3

    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role.lower(),
        mobile_number=user.mobile_number, 
        max_tokens=token_limit,
        registration_number=user.registration_number,
        branch=user.branch,
        year=user.year
    )
    db.add(new_user)
    db.commit()
    return {"message": "Account created successfully"}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token, 
        "user_id": user.id, 
        "role": user.role, 
        "full_name": user.full_name,
        "photo_url": user.photo_url
    }

# backend/main.py

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Get Active Loans (Borrowed Books)
    loans = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.return_date == None
    ).all()
    
    loan_data = []
    for loan in loans:
        book = db.query(models.Book).filter(models.Book.id == loan.book_id).first()
        fine = 0.0
        if date.today() > loan.due_date and current_user.role == "student":
            days = (date.today() - loan.due_date).days
            fine = days * 5.0

        loan_data.append({
            "transaction_id": loan.id,
            "title": book.title,
            "acc_no": book.acc_no,
            "issue_date": loan.issue_date,
            "due_date": loan.due_date,
            "status": loan.status,
            "fine_est": fine
        })

    # 2. Get Pending Requests (NEW)
    requests = db.query(models.RentRequest).filter(
        models.RentRequest.user_id == current_user.id,
        models.RentRequest.status == "pending"
    ).all()

    request_data = []
    for req in requests:
        book = db.query(models.Book).filter(models.Book.id == req.book_id).first()
        request_data.append({
            "request_id": req.id,
            "title": book.title,
            "acc_no": book.acc_no,
            "request_date": req.request_date,
            "status": "Pending Approval"
        })

    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "mobile_number": current_user.mobile_number,
        "registration_number": current_user.registration_number,
        "branch": current_user.branch,
        "year": current_user.year,
        "photo_url": current_user.photo_url,
        "max_tokens": current_user.max_tokens,
        "active_loans": loan_data,
        "pending_requests": request_data # <--- Sending this to Frontend
    }

# --- EXISTING TEXT UPDATE ENDPOINT ---
@app.put("/users/me")
def update_user_me(user_update: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.full_name: current_user.full_name = user_update.full_name
    if user_update.registration_number: current_user.registration_number = user_update.registration_number
    if user_update.branch: current_user.branch = user_update.branch
    if user_update.year: current_user.year = user_update.year
    if user_update.mobile_number: current_user.mobile_number = user_update.mobile_number
    # photo_url update removed from here
    
    db.commit()
    db.refresh(current_user)
    return current_user

# 1. UPDATED PHOTO UPLOAD (Fixes 304 Cache Issue)
@app.post("/users/me/photo")
async def upload_photo(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, detail="File must be an image")

    # Generate Unique Filename with Timestamp
    file_extension = os.path.splitext(file.filename)[1]
    timestamp = int(time.time()) 
    new_filename = f"user_{current_user.id}_{timestamp}{file_extension}" # <--- Unique Name
    
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    # Delete old photo if it exists to save space (Optional logic)
    if current_user.photo_url:
        try:
            old_filename = current_user.photo_url.split("/")[-1]
            old_path = os.path.join(UPLOAD_DIR, old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)
        except:
            pass # Ignore errors deletion errors

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
         raise HTTPException(500, detail=f"Could not save file: {e}")

    full_url = f"http://127.0.0.1:8000/{UPLOAD_DIR}/{new_filename}"
    current_user.photo_url = full_url
    db.commit()
    
    return {"photo_url": full_url}


# --- BOOK SEARCH ---
@app.get("/books/search/")
def search_books(query: str, db: Session = Depends(get_db)):
    books = db.query(models.Book).filter(
        (models.Book.title.contains(query)) |
        (models.Book.author.contains(query)) |
        (models.Book.acc_no.contains(query))|
        (models.Book.department.contains(query))
    ).all()
    return books

# --- ADMIN ISSUE ---
@app.post("/admin/issue-book")
def issue_book(request: IssueRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(models.User).filter(models.User.email == request.student_email).first()
    book = db.query(models.Book).filter(models.Book.acc_no == request.book_acc_no).first()

    if not user: raise HTTPException(status_code=404, detail="Student email not found")
    if not book: raise HTTPException(status_code=404, detail="Book Accession No not found")
    if book.available_copies < 1: raise HTTPException(status_code=400, detail="Book out of stock")

    active_issues = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id, 
        models.Transaction.return_date == None
    ).count()

    if active_issues >= user.max_tokens:
        raise HTTPException(status_code=400, detail=f"User limit reached ({user.max_tokens})")

    days = 30 if user.role == "faculty" else 15
    due = date.today() + timedelta(days=days)

    new_issue = models.Transaction(
        user_id=user.id, book_id=book.id,
        issue_date=date.today(), due_date=due, status="Issued"
    )
    
    book.available_copies -= 1
    db.add(new_issue)
    db.commit()
    return {"message": "Success", "book": book.title, "student": user.full_name, "due_date": due}

# --- RETURN LOGIC ---

@app.post("/user/return-request/{transaction_id}")
def request_return(transaction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    txn = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not txn: raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status != "Issued": raise HTTPException(status_code=400, detail="Return already requested or completed")

    txn.status = "Return Requested"
    db.commit()
    return {"message": "Return request sent to Admin"}

# --- UPDATED: Admin Stats with Inventory Counts ---
@app.get("/admin/dashboard-stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Admin only")

    # 1. COUNTERS
    total_books_count = db.query(models.Book).count()
    books_lent_count = db.query(models.Transaction).filter(models.Transaction.return_date == None).count()
    total_available_copies = db.query(func.sum(models.Book.available_copies)).scalar() or 0

    # 2. INCOMING BORROW REQUESTS (RentRequest Table)
    borrow_requests = db.query(models.RentRequest).filter(models.RentRequest.status == "pending").all()
    borrow_data = []
    for req in borrow_requests:
        borrow_data.append({
            "request_id": req.id,
            "student_name": req.user.full_name,
            "student_photo": req.user.photo_url,
            "student_reg": req.user.registration_number,
            "book_title": req.book.title,
            "book_acc_no": req.book.acc_no,
            "request_date": req.request_date
        })

    # 3. RETURN REQUESTS (Transaction Table with status 'Return Requested')
    return_requests = db.query(models.Transaction).filter(models.Transaction.status == "Return Requested").all()
    return_data = []
    for txn in return_requests:
        return_data.append({
            "request_id": txn.id,
            "student_name": txn.borrower.full_name,
            "student_photo": txn.borrower.photo_url,
            "student_reg": txn.borrower.registration_number,
            "book_title": txn.book.title,
            "book_acc_no": txn.book.acc_no,
            "due_date": txn.due_date
        })

    # 4. ACTIVE ISSUED LOANS (Transaction Table with status 'Issued')
    active = db.query(models.Transaction).filter(models.Transaction.status == "Issued").all()
    active_data = []
    for loan in active:
        fine = 0.0
        if date.today() > loan.due_date and loan.borrower.role == "student":
            days = (date.today() - loan.due_date).days
            fine = days * 5.0
            
        active_data.append({
            "transaction_id": loan.id,
            "student_name": loan.borrower.full_name,
            "student_email": loan.borrower.email,
            "student_mobile": loan.borrower.mobile_number,
            "student_branch": loan.borrower.branch,
            "student_year": loan.borrower.year,
            "student_photo": loan.borrower.photo_url,
            "student_reg": loan.borrower.registration_number,
            "book_title": loan.book.title,
            "book_acc_no": loan.book.acc_no,
            "issue_date": loan.issue_date,
            "due_date": loan.due_date,
            "fine_est": fine
        })

    return {
        "total_books": total_books_count,
        "books_lent": books_lent_count,
        "available_copies": total_available_copies,
        "borrow_requests": borrow_data, # NEW
        "return_requests": return_data, # NEW
        "active_loans": active_data
    }
@app.post("/admin/approve-return/{transaction_id}")
def approve_return(transaction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Admin only")
    
    txn = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not txn: raise HTTPException(status_code=404, detail="Transaction not found")

    user = db.query(models.User).filter(models.User.id == txn.user_id).first()
    
    # Calculate Fine
    fine = 0.0
    if date.today() > txn.due_date and user.role == "student":
        days = (date.today() - txn.due_date).days
        fine = days * 5.0

    txn.return_date = date.today()
    txn.status = "Returned"
    txn.fine_amount = fine
    
    # Restock Book
    book = db.query(models.Book).filter(models.Book.id == txn.book_id).first()
    book.available_copies += 1
    
    db.commit()
    return {"message": "Return Approved", "fine": fine}
# --- ADD THESE MISSING ENDPOINTS TO backend/main.py ---

# 1. STUDENT: Request a Book
@app.post("/request-book/{book_id}")
def request_book(book_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if book exists
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Book is out of stock")

    # Check if already requested
    existing = db.query(models.RentRequest).filter(
        models.RentRequest.user_id == current_user.id,
        models.RentRequest.book_id == book_id,
        models.RentRequest.status == "pending" # Make sure 'pending' matches your Enum or string
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already requested this book")

    # Create Request
    new_request = models.RentRequest(
        user_id=current_user.id,
        book_id=book_id,
        request_date=date.today(),
        status="pending"
    )
    db.add(new_request)
    db.commit()
    return {"message": "Request sent successfully! Wait for Admin approval."}

# 2. ADMIN: View Pending Requests
@app.get("/admin/requests/pending")
def get_pending_requests(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
        
    requests = db.query(models.RentRequest).filter(models.RentRequest.status == "pending").all()
    
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

# 3. ADMIN: Approve Request
@app.post("/admin/requests/{request_id}/approve")
def approve_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Admin access required")

    req = db.query(models.RentRequest).filter(models.RentRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")

    if req.book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Book is out of stock")

    # Create the Transaction (Issue the book)
    days = 15 if req.user.role == 'student' else 30
    new_txn = models.Transaction(
        user_id=req.user_id,
        book_id=req.book_id,
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=days),
        status="Issued"
    )

    # Update Request Status & Stock
    req.status = "approved"
    req.book.available_copies -= 1
    
    db.add(new_txn)
    db.commit()
    return {"message": "Request Approved & Book Issued"}

# 4. ADMIN: Reject Request
@app.post("/admin/requests/{request_id}/reject")
def reject_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Admin access required")

    req = db.query(models.RentRequest).filter(models.RentRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")

    req.status = "rejected"
    db.commit()
    return {"message": "Request Rejected"}
# --- NEW: User Management Endpoint ---
@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != 'admin': raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(models.User).filter(models.User.role != 'admin').all()
    user_list = []
    for u in users:
        # Count active loans for this user
        active_loans = db.query(models.Transaction).filter(
            models.Transaction.user_id == u.id, 
            models.Transaction.return_date == None
        ).count()
        
        user_list.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "registration_number": u.registration_number,
            "role": u.role,
            "active_loans": active_loans,
            "photo_url": u.photo_url
        })
    return user_list