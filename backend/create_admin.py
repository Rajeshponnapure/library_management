# backend/create_admin.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

# 1. Setup
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    email = "admin@cbit.edu.in"
    password = "admin123"
    
    # Check if exists
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        print(f"✅ Admin already exists! (ID: {existing.id})")
        # Optional: Reset password just in case
        existing.hashed_password = pwd_context.hash(password)
        db.commit()
        print("   (Password reset to 'admin123')")
        return

    # Create new Admin
    new_admin = models.User(
        email=email,
        hashed_password=pwd_context.hash(password),
        full_name="Chief Librarian",
        role="admin",
        mobile_number="0000000000",
        max_tokens=0
    )
    
    db.add(new_admin)
    db.commit()
    print("🎉 Success! Admin created.")
    print(f"📧 Email: {email}")
    print(f"🔑 Pass:  {password}")

if __name__ == "__main__":
    create_admin()