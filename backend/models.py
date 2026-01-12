# backend/models.py (Updated)
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # 'student', 'faculty', 'admin'
    max_tokens = Column(Integer, default=3) 
    
    # New fields for student details
    registration_number = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    issued_books = relationship("Transaction", back_populates="borrower")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    
    # Exact mapping from your CSV headers
    acc_no = Column(String,  nullable=True)  # "Acc.NO"
    author = Column(String)                           # "Author"
    title = Column(String, index=True)                # "Title"
    department = Column(String)                       # "Dept"
    total_copies = Column(Integer)                    # "No.of Copies"
    available_copies = Column(Integer)                # We calculate this
    edition_year = Column(String)                     # "Edition/Year"
    pages = Column(String)                            # "Pages"
    volume = Column(String)                           # "Volume"
    publisher = Column(String)                        # "Publisher"
    source = Column(String)                           # "Sources"
    bill_no_date = Column(String)                     # "Bill No & Date"
    cost = Column(String)                             # "Cost"

    transactions = relationship("Transaction", back_populates="book")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    issue_date = Column(Date)
    due_date = Column(Date)
    return_date = Column(Date, nullable=True)
    fine_amount = Column(Float, default=0.0)

    borrower = relationship("User", back_populates="issued_books")
    book = relationship("Book", back_populates="transactions")