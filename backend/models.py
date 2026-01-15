# backend/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # 'student', 'faculty', 'admin'   
    # Contact & Photo
    mobile_number = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)   
    # Academic Details
    registration_number = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)   
    max_tokens = Column(Integer, default=3) 
    # Relationships
    issued_books = relationship("Transaction", back_populates="borrower")
    requests = relationship("RentRequest", back_populates="user")
class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    acc_no = Column(String, index=True)
    title = Column(String, index=True)
    author = Column(String)
    department = Column(String)
    publisher = Column(String)
    edition_year = Column(String)   
    # Extra fields
    pages = Column(String, nullable=True)
    call_no = Column(String, nullable=True)   
    total_copies = Column(Integer)
    available_copies = Column(Integer)
    # Relationships
    transactions = relationship("Transaction", back_populates="book")
    requests = relationship("RentRequest", back_populates="book")
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))   
    issue_date = Column(Date)
    due_date = Column(Date)
    return_date = Column(Date, nullable=True)    
    # Status: 'Issued', 'Return Requested', 'Returned'
    status = Column(String, default="Issued") 
    fine_amount = Column(Float, default=0.0)
    borrower = relationship("User", back_populates="issued_books")
    book = relationship("Book", back_populates="transactions")
# --- THIS WAS MISSING ---
class RentRequest(Base):
    __tablename__ = "rent_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))   
    request_date = Column(Date)
    status = Column(String, default="pending") # 'pending', 'approved', 'rejected'
    user = relationship("User", back_populates="requests")
    book = relationship("Book", back_populates="requests")