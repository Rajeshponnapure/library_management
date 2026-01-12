from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
import models, database
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
origins = [
    "http://localhost:5173",  # This is where Vite usually runs
    "http://localhost:3000",  # Just in case
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. SETUP: Create Default Admin on Startup ---
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
            max_tokens=0 # Admin doesn't borrow logic usually, or set high
        )
        db.add(new_admin)
        db.commit()
    db.close()

# --- 2. SEARCH: The 'Search by Anything' feature ---
@app.get("/books/search/")
def search_books(query: str, db: Session = Depends(get_db)):
    # Searches Title OR Author OR AccNo OR Department, etc.
    books = db.query(models.Book).filter(
        (models.Book.title.contains(query)) |
        (models.Book.author.contains(query)) |
        (models.Book.acc_no.contains(query)) |
        (models.Book.department.contains(query))
    ).all()
    return books

# --- 3. ISSUE BOOK: The Logic Core ---
@app.post("/issue-book/")
def issue_book(user_id: int, book_id: int, db: Session = Depends(get_db)):
    # A. Get User and Book
    user = db.query(models.User).filter(models.User.id == user_id).first()
    book = db.query(models.Book).filter(models.Book.id == book_id).first()

    if not user or not book:
        raise HTTPException(status_code=404, detail="User or Book not found")

    # B. Check Availability
    if book.available_copies < 1:
        raise HTTPException(status_code=400, detail="Book is out of stock")

    # C. Check Token Limit (How many unreturned books does user have?)
    active_issues = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.return_date == None
    ).count()

    if active_issues >= user.max_tokens:
        raise HTTPException(status_code=400, detail=f"User limit reached ({user.max_tokens} books)")

    # D. Calculate Due Date
    days_allowed = 15 if user.role == "student" else 30
    due_date = date.today() + timedelta(days=days_allowed)

    # E. Create Transaction & Update Book Count
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

# --- 4. RETURN BOOK & FINES ---
@app.post("/return-book/")
def return_book(transaction_id: int, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    
    if not txn or txn.return_date:
        raise HTTPException(status_code=400, detail="Transaction invalid or already returned")

    user = db.query(models.User).filter(models.User.id == txn.user_id).first()
    
    # Calculate Fine
    fine = 0.0
    today = date.today()
    if today > txn.due_date and user.role == "student":
        overdue_days = (today - txn.due_date).days
        fine = overdue_days * 5.0 # Example: 5 rupees per day
    
    # Update Transaction
    txn.return_date = today
    txn.fine_amount = fine
    
    # Update Book Stock
    book = db.query(models.Book).filter(models.Book.id == txn.book_id).first()
    book.available_copies += 1
    
    db.commit()
    return {"message": "Book returned", "fine_to_pay": fine}