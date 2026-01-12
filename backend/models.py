from sqlalchemy import Column, Integer, String, Date, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import enum

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)
    max_tokens = Column(Integer)
    registration_number = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    transactions = relationship("Transaction", back_populates="user")
    requests = relationship("RentRequest", back_populates="user")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- CHANGED: Removed 'unique=True' so we can store duplicates ---
    acc_no = Column(String, index=True) 
    
    title = Column(String, index=True)
    author = Column(String)
    department = Column(String) 

    # Excel Data Mapping
    publisher = Column(String, nullable=True)
    edition_year = Column(String, nullable=True)
    price = Column(Float, default=0.0)
    pages = Column(String, nullable=True)
    acquisition_date = Column(String, nullable=True)
    call_no = Column(String, nullable=True)
    bill_no = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    
    total_copies = Column(Integer, default=1)
    available_copies = Column(Integer, default=1)

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
    fine_amount = Column(Float, default=0.0)
    user = relationship("User", back_populates="transactions")
    book = relationship("Book", back_populates="transactions")

class RentRequest(Base):
    __tablename__ = "rent_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    request_date = Column(Date)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)
    user = relationship("User", back_populates="requests")
    book = relationship("Book", back_populates="requests")