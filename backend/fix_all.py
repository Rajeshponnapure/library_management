from database import SessionLocal
from models import User, Book, RentRequest
from passlib.context import CryptContext
import datetime

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("--- 🛠️ FIXING LIBRARY DATABASE 🛠️ ---")

# 1. RESTORE ADMIN USER (If missing)
admin = db.query(User).filter(User.email == "admin@cbit.edu.in").first()
if not admin:
    print("⚠️ Admin not found. Creating Admin...")
    new_admin = User(
        full_name="Chief Librarian",
        email="admin@cbit.edu.in",
        hashed_password=pwd_context.hash("admin123"), # Sets password to 'admin123'
        role="admin",
        photo_url=""
    )
    db.add(new_admin)
    db.commit()
    print("✅ Admin Account Restored! (Login: admin@cbit.edu.in / admin123)")
else:
    print("✅ Admin Account exists.")

# 2. RESTORE STUDENT USER (If missing)
student = db.query(User).filter(User.role == "student").first()
if not student:
    print("⚠️ No students found. Creating a test student...")
    new_student = User(
        full_name="Rahul Student",
        email="232p1a3233@cbit.edu.in",
        hashed_password=pwd_context.hash("student123"),
        role="student",
        registration_number="232P1A3233",
        branch="CSE",
        year="2"
    )
    db.add(new_student)
    db.commit()
    student = new_student
    print("✅ Student Account Created.")
else:
    print(f"✅ Student found: {student.full_name}")

# 3. ADD BOOKS (If empty)
if db.query(Book).count() == 0:
    print("⚠️ Library is empty. Adding books...")
    db.add(Book(title="Python Programming", author="Guido", acc_no="CSE-100", department="CSE", total_copies=5, available_copies=5))
    db.add(Book(title="Circuit Theory", author="Bakshi", acc_no="ECE-200", department="ECE", total_copies=5, available_copies=5))
    db.commit()
    print("✅ Added 2 Books.")
else:
    print("✅ Books exist.")

# 4. ADD REQUEST (So you have something to approve)
book = db.query(Book).first()
if student and book:
    existing = db.query(RentRequest).filter_by(user_id=student.id, book_id=book.id).first()
    if not existing:
        db.add(RentRequest(user_id=student.id, book_id=book.id, request_date=datetime.date.today(), status="pending"))
        db.commit()
        print("✅ Created a 'Pending Request' for you to see.")
    else:
        print("✅ Pending Request already exists.")

print("\n--- ✅ REPAIR COMPLETE ---")