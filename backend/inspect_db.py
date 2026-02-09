import sqlite3
import pandas as pd

# Connect to database
db_path = "library.db"
conn = sqlite3.connect(db_path)

# 1. Check User Data
print("\n--- 👤 USERS ---")
users = pd.read_sql("SELECT id, full_name, email, role FROM users", conn)
print(users)

# 2. Check Book Data (First 5 rows)
print("\n--- 📚 BOOKS (First 5 Rows) ---")
try:
    # Select specific columns to check for NULLs
    books = pd.read_sql("SELECT id, title, author, publisher, bill_number, cost FROM books LIMIT 5", conn)
    if books.empty:
        print("⚠️  The Books table is EMPTY.")
    else:
        print(books)
        print("\nChecking for NULLs:")
        print(books.isnull().sum())
except Exception as e:
    print(f"Error reading books: {e}")

conn.close()