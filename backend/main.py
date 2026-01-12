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
import os
from dotenv import load_dotenv # <--- New Import

# --- 0. CONFIGURATION ---
load_dotenv() # <--- Load the .env file

# Get values from .env (with defaults just in case)
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Initialize Database Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# --- 1. CORS (CONNECT TO FRONTEND) ---
origins = [
    "http://localhost:5173",  # Vite Frontend
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. SECURITY TOOLS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. VALIDATION MODELS ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # 'student' or 'faculty'
    # Optional fields (only for students)
    registration_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None

# --- 4. STARTUP EVENT ---
@app.on_event("startup")
def create_default_admin():
    db = database.SessionLocal()
    admin = db.query(models.User).filter(models.User.email == "admin@college.edu").first()
    if not admin:
        hashed_pw = pwd_context.hash("admin123")
        new_admin = models.User(
            email="admin@college.edu",
            hashed_password=hashed_pw,
            role="admin",
            full_name="Chief Librarian",
            max_tokens=0 
        )
        db.add(new_admin)
        db.commit()
    db.close()

# --- 5. API ENDPOINTS ---

# A. SIGNUP
@app.post("/signup", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash Password
    hashed_password = pwd_context.hash(user.password)

    # Assign Tokens
    token_limit = 10 if user.role.lower() == "faculty" else 3

    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role.lower(),
        max_tokens=token_limit, 
        registration_number=user.registration_number,
        branch=user.branch,
        year=user.year
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Account created successfully", "user_id": new_user.id}

# B. LOGIN (Generate Token)
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find User
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Verify Password
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate Token
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# C. SEARCH BOOKS
@app.get("/books/search/")
def search_books(query: str, db: Session = Depends(get_db)):
    books = db.query(models.Book).filter(
        (models.Book.title.contains(query)) |
        (models.Book.author.contains(query)) |
        (models.Book.acc_no.contains(query)) |
        (models.Book.department.contains(query))
    ).all()
    return books

# D. ISSUE BOOK
@app.post("/issue-book/")
def issue_book(user_id: int, book_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    book = db.query(models.Book).filter(models.Book.id == book_id).first()

    if not user or not book:
        raise HTTPException(status_code=404, detail="User or Book not found")

    if book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Book is out of stock")

    active_issues = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.return_date == None
    ).count()

    if active_issues >= user.max_tokens:
        raise HTTPException(status_code=400, detail=f"User limit reached ({user.max_tokens} books)")

    days_allowed = 15 if user.role == "student" else 30
    due_date = date.today() + timedelta(days=days_allowed)

    new_issue = models.Transaction(
        user_id=user.id,
        book_id=book.id,
        issue_date=date.today(),
        due_date=due_date
    )
    book.available_copies -= 1
    
    db.add(new_issue)
    db.commit()
    return {"message": "Book issued successfully", "due_date": due_date}

# E. RETURN BOOK
@app.post("/return-book/")
def return_book(transaction_id: int, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    
    if not txn or txn.return_date:
        raise HTTPException(status_code=400, detail="Transaction invalid or already returned")

    user = db.query(models.User).filter(models.User.id == txn.user_id).first()
    
    fine = 0.0
    today = date.today()
    if today > txn.due_date and user.role == "student":
        overdue_days = (today - txn.due_date).days
        fine = overdue_days * 5.0 
    
    txn.return_date = today
    txn.fine_amount = fine
    
    book = db.query(models.Book).filter(models.Book.id == txn.book_id).first()
    book.available_copies += 1
    
    db.commit()
    return {"message": "Book returned", "fine_to_pay": fine}