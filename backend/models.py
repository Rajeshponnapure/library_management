# backend/models.py
from datetime import date
from typing import Optional

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    mobile_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    branch: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    max_tokens: Mapped[int] = mapped_column(default=3)

    issued_books: Mapped[list["Transaction"]] = relationship(back_populates="borrower")
    requests: Mapped[list["RentRequest"]] = relationship(back_populates="user")


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acc_no: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    author: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)

    publisher: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    edition_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pages: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    volume: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bill_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bill_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    call_no: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_copies: Mapped[int] = mapped_column()
    available_copies: Mapped[int] = mapped_column()

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="book")
    requests: Mapped[list["RentRequest"]] = relationship(back_populates="book")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    issue_date: Mapped[date] = mapped_column()
    due_date: Mapped[date] = mapped_column()
    return_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String, default="Issued")
    fine_amount: Mapped[float] = mapped_column(Float, default=0.0)
    renewal_count: Mapped[int] = mapped_column(default=0)

    borrower: Mapped["User"] = relationship(back_populates="issued_books")
    book: Mapped["Book"] = relationship(back_populates="transactions")


class RentRequest(Base):
    __tablename__ = "rent_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    request_date: Mapped[date] = mapped_column()
    status: Mapped[str] = mapped_column(String, default="pending")

    user: Mapped["User"] = relationship(back_populates="requests")
    book: Mapped["Book"] = relationship(back_populates="requests")
