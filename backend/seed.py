# backend/seed.py
import os
from database import SessionLocal, engine
from models import Base, User
from passlib.context import CryptContext

# 1. SETUP DATABASE
print("--- 🚀 INITIALIZING LIBRARY SYSTEM ---")

# Optional: Delete old DB to start fresh
if os.path.exists("library.db"):
    os.remove("library.db")
    print("🗑️  Old database removed.")

Base.metadata.create_all(bind=engine)
db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. CHECK IF ADMIN EXISTS
admin = db.query(User).filter(User.role == "admin").first()

if not admin:
    print("👤 Creating Default Admin Account...")
    admin_user = User(
        full_name="Chief Librarian", 
        email="admin@cbit.edu.in", 
        hashed_password=pwd_context.hash("admin123"), 
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    print("✅ Admin Created: admin@cbit.edu.in / admin123")
else:
    print("ℹ️  Admin account already exists.")

print("\n✨ System Ready! Log in to the Dashboard to upload your Excel sheet.")