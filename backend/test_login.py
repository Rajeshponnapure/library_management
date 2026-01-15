# backend/test_login.py
from database import SessionLocal
import models
from passlib.context import CryptContext

# 1. Setup
db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_user_login(email, password_to_try):
    print(f"\n--- TESTING LOGIN FOR {email} ---")
    
    # 2. Find User
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print("❌ User NOT found in database.")
        return

    print(f"✅ User found: {user.full_name}")
    print(f"   Stored Hash: {user.hashed_password[:20]}...") # Show first 20 chars

    # 3. Verify Password
    try:
        is_correct = pwd_context.verify(password_to_try, user.hashed_password)
        if is_correct:
            print(f"✅ SUCCESS! Password '{password_to_try}' matches the hash.")
        else:
            print(f"❌ FAILURE! Password '{password_to_try}' does NOT match the hash.")
    except Exception as e:
        print(f"❌ CRASH! Error verifying password: {e}")
        print("   (This usually means bcrypt version is wrong. Run: pip install bcrypt==3.2.0)")

# --- CHANGE THIS TO YOUR USER ---
test_user_login("ponnapureddyrajesh43936@gmail.com", "Rajesh9121")