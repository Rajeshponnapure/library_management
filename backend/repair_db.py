# backend/repair_db.py
import os
from database import SessionLocal, engine
from models import Base, User
from passlib.context import CryptContext

# 1. RESET DATABASE
if os.path.exists("library.db"):
    os.remove("library.db")
    print("🗑️ Old database deleted.")

Base.metadata.create_all(bind=engine)
db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. CREATE ADMIN ONLY
print("👤 Creating Admin User...")
admin = User(
    full_name="Chief Librarian", 
    email="admin@cbit.edu.in", 
    hashed_password=pwd_context.hash("admin123"), 
    role="admin"
)
db.add(admin)
db.commit()

print("✅ Database Reset. Admin Created.")
print("👉 You can now log in and upload your Excel sheet via the Dashboard.")