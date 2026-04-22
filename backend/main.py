# backend/main.py
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # --- NEW IMPORT ---
from fastapi.security import OAuth2PasswordRequestForm #
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta,datetime
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Any, Optional
from jose import jwt, JWTError
import models, database
import os
import shutil # --- NEW IMPORT for saving files ---
from dotenv import load_dotenv
import time
import gspread
from google.oauth2.service_account import Credentials

class BookCreateSchema(BaseModel):
    title: str
    author: str
    acc_no: str
    department: str
    total_copies: int
    # New Excel Fields
    publisher: Optional[str] = ""
    edition_year: Optional[str] = ""
    pages: Optional[str] = ""
    volume: Optional[str] = ""
    source: Optional[str] = ""
    bill_number: Optional[str] = ""
    cost: Optional[float] = 0.0

# --- SETUP ---
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# Load Credentials
creds = Credentials.from_service_account_file("credentials.json", scopes=SCOPES)
client = gspread.authorize(creds)

# Open the Sheet (Replace with your actual Sheet Name)
SHEET_NAME = "CBIT Library Data"
try:
    sheet = client.open(SHEET_NAME)
    books_sheet = sheet.worksheet("Acc.Reg") # Ensure this tab exists!
except Exception as e:
    print(f"Error opening sheet: {e}")

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
        email = payload.get("sub")
        if not isinstance(email, str): raise HTTPException(status_code=401, detail="Invalid token")
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
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Query the user (We map 'email' to the standard 'username' field)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    # 2. Verify Password
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 3. Create Token
    # We put the email in the 'sub' (subject) field of the token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
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
        book = loan.book
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
        book = req.book
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
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(400, detail="File must be an image")

    # Generate Unique Filename with Timestamp
    upload_name = file.filename or "profile"
    file_extension = os.path.splitext(upload_name)[1]
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
def search_books(
    query: str = "", 
    department: str = "All", 
    page: int = 1,      # <--- New Parameter
    limit: int = 20,    # <--- New Parameter
    db: Session = Depends(get_db)
):
    # 1. Start Query
    db_query = db.query(models.Book)
    
    # 2. Apply Search Filters
    if query:
        search = f"%{query}%"
        db_query = db_query.filter(
            (models.Book.title.ilike(search)) | 
            (models.Book.author.ilike(search)) |
            (models.Book.acc_no.ilike(search)) |
            (models.Book.publisher.ilike(search)) | 
            (models.Book.source.ilike(search)) |    
            (models.Book.bill_number.ilike(search)) 
        )
    
    # 3. Apply Department Filter
    if department and department != "All":
        db_query = db_query.filter(models.Book.department == department)
        
    # 4. Get Total Count (So frontend knows how many pages exist)
    total_books = db_query.count()
    
    # 5. Apply Pagination Logic (Skip & Take)
    offset = (page - 1) * limit
    books = db_query.offset(offset).limit(limit).all()
    
    # 6. Return Data in the new format the Frontend expects
    return {
        "data": books,
        "total": total_books,
        "page": page,
        "limit": limit,
        "total_pages": (total_books + limit - 1) // limit
    }
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
    if not user:
        raise HTTPException(status_code=404, detail="Borrower not found")
    
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
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
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
# backend/main.py

@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Check if Admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # 2. Fetch Users
    users = db.query(models.User).all()
    
    # 3. Format Data
    user_list = []
    for u in users:
        # Calculate active loans for each user
        active_loans = db.query(models.Transaction).filter(
            models.Transaction.user_id == u.id,
            models.Transaction.status == "Issued"
        ).count()
        
        user_list.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "registration_number": u.registration_number,
            "photo_url": u.photo_url,
            "active_loans": active_loans
        })
    return user_list
# backend/main.py

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Admin Authorization
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # 2. Find the user
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. SAFETY CHECK: Do not delete if they have books!
    # We check if they have any active transactions (books not returned)
    active_loans = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id, 
        models.Transaction.status == "Issued"
    ).count()

    if active_loans > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete user. They still have {active_loans} books to return.")

    # 4. Delete the User
    db.delete(user_to_delete)
    db.commit()

    return {"message": "User deleted successfully"}
# backend/main.py

@app.post("/books/")
def create_book(book: BookCreateSchema, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if Acc No exists
    if db.query(models.Book).filter(models.Book.acc_no == book.acc_no).first():
        raise HTTPException(status_code=400, detail="Book with this Accession Number already exists.")

    new_book = models.Book(
        title=book.title,
        author=book.author,
        acc_no=book.acc_no,
        department=book.department,
        total_copies=book.total_copies,
        available_copies=book.total_copies, 
        # New Fields
        publisher=book.publisher,
        edition_year=book.edition_year,
        pages=book.pages,
        volume=book.volume,
        source=book.source,
        bill_number=book.bill_number,
        cost=book.cost
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return {"message": "Book added successfully", "book_id": new_book.id}

@app.post("/admin/upload-books")
def upload_books_excel(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # 1. Read ALL sheets
        all_sheets = pd.read_excel(file.file, sheet_name=None, header=None)
        
        titles_added = 0
        total_copies_added = 0
        processed_sheets = []
        
        # --- SMART SELECTION STRATEGY ---
        # If "Acc.Reg" exists, we ONLY process that + "Extra Books".
        # We ignore "CSE", "ECE", etc. because they are already inside "Acc.Reg".
        
        target_sheets = {}
        
        # Check if we can find the Master Sheet
        master_sheet_key = next((k for k in all_sheets.keys() if "acc.reg" in k.lower()), None)
        extra_sheet_key = next((k for k in all_sheets.keys() if "extra" in k.lower()), None)

        if master_sheet_key:
            print(f"✅ Found Master Sheet: '{master_sheet_key}'. Ignoring department subsets.")
            target_sheets[master_sheet_key] = all_sheets[master_sheet_key]
            if extra_sheet_key:
                target_sheets[extra_sheet_key] = all_sheets[extra_sheet_key]
        else:
            print("⚠️ Master Sheet not found. Processing ALL sheets (Risk of duplicates if not careful).")
            target_sheets = all_sheets

        # --------------------------------

        for sheet_name, raw_df in target_sheets.items():
            print(f"--- Processing Sheet: {sheet_name} ---")
            
            # 2. FIND HEADER ROW
            header_row_index = -1
            has_accession_col = False
            
            for i in range(min(15, len(raw_df.index))): # Scan first 15 rows
                row = raw_df.iloc[i]
                row_str = row.astype(str).str.lower().tolist()
                
                # Check for Accession No header
                if any("acc.no" in x or "acc no" in x for x in row_str):
                    header_row_index = i
                    has_accession_col = True
                    break
                # Check for Extra Books header
                if any("s.no" in x for x in row_str) and any("cost" in x for x in row_str) and "extra" in str(sheet_name).lower():
                    header_row_index = i
                    has_accession_col = False
                    break
            
            if header_row_index == -1:
                print(f"Skipping '{sheet_name}': No valid header.")
                continue

            # 3. PREPARE DATA
            raw_df.columns = raw_df.iloc[header_row_index] 
            df = raw_df.iloc[header_row_index + 1:].reset_index(drop=True)
            df = df.rename(columns=lambda col: str(col).strip().lower().replace('.', '_').replace(' ', '_'))
            df = df.T.drop_duplicates().T

            # 4. INSERT BOOKS
            for index, row in df.iterrows():
                def get_val(keywords: list[str]) -> Any | None:
                    for col in df.columns:
                        column_name = str(col)
                        if any(k in column_name for k in keywords):
                            value = row.get(column_name)
                            return value if pd.notnull(value) else None
                    return None

                # GENERATE ID
                if has_accession_col:
                    acc_val = get_val(['acc_no', 'acc_num'])
                    if not acc_val: continue
                    acc_no = str(acc_val).strip()
                else:
                    # Extra Books ID
                    s_no = get_val(['s_no', 'sl_no'])
                    if not s_no: continue
                    acc_no = f"EXTRA-{int(float(s_no))}"

                # PREVENT DUPLICATES (Database Check)
                if db.query(models.Book).filter(models.Book.acc_no == acc_no).first():
                    continue 

                # EXTRACT FIELDS
                copies_val = get_val(['no_of_copies', 'copies'])
                try:
                    total_copies = int(float(copies_val)) if copies_val else 1
                except:
                    total_copies = 1

                cost_val = get_val(['cost'])
                try:
                    if isinstance(cost_val, str): cost_val = cost_val.replace('-', '.')
                    cost = float(cost_val) if cost_val else 0.0
                except:
                    cost = 0.0

                new_book = models.Book(
                    acc_no=acc_no,
                    title=str(get_val(['title']) or "Unknown"),
                    author=str(get_val(['author']) or "Unknown"),
                    department=str(get_val(['dept']) or "General"),
                    publisher=str(get_val(['publisher']) or ""),
                    edition_year=str(get_val(['edition']) or ""),
                    pages=str(get_val(['pages']) or ""),
                    volume=str(get_val(['volume']) or ""),
                    source=str(get_val(['sources', 'source']) or ""),
                    bill_number=str(get_val(['bill']) or ""),
                    cost=cost,
                    total_copies=total_copies,
                    available_copies=total_copies
                )
                db.add(new_book)
                titles_added += 1
                total_copies_added += total_copies
            
            processed_sheets.append(sheet_name)

        db.commit()
        return {
            "message": f"Success! Processed: {', '.join(processed_sheets)}. Added {titles_added} Titles ({total_copies_added} Physical Books). Numbers should now match your Excel."
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
# --- ADD THIS TO ENABLE DELETING BOOKS ---
@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}
