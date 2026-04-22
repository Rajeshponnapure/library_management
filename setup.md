# Setup Guide

This guide explains how to set up the CBIT Digital Library Management System on a new desktop.

## 1. Install Required Software

Install these first:

- Python 3.10 or newer
- Node.js 20 or newer
- Git
- Visual Studio Code, recommended

After installing, check that Python and Node are available:

```powershell
python --version
node --version
npm --version
```

On some Windows systems, Python may be available as `py` instead of `python`.

## 2. Open the Project

Clone or copy the project folder to your computer, then open it:

```powershell
cd C:\library_management
```

If your folder is in a different location, replace `C:\library_management` with your actual path.

## 3. Backend Setup

Go to the backend folder:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
py -3 -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and set your own secret key:

```text
SECRET_KEY=replace-this-with-a-long-random-secret
```

## 4. Google Credentials Setup

The backend expects a Google service account file at:

```text
backend/credentials.json
```

Use `backend/credentials.example.json` only as a format reference. Do not put real secrets in the example file.

To make Google Sheets work:

1. Create or use a Google Cloud service account.
2. Download its JSON credentials.
3. Rename the file to `credentials.json`.
4. Place it inside the `backend/` folder.
5. Share the Google Sheet with the service account email.

The app currently expects:

```text
Google Sheet name: CBIT Library Data
Worksheet/tab name: Acc.Reg
```

If `credentials.json` is missing or invalid, the backend may fail during startup.

## 5. Database and Admin Setup

The project uses SQLite by default:

```text
backend/library.db
```

Create or reset the default admin account:

```powershell
python create_admin.py
```

Default admin login:

```text
Email: admin@cbit.edu.in
Password: admin123
```

Change this password before using the system with real users.

If you want to rebuild the database from scratch:

```powershell
python seed.py
```

Be careful: `seed.py` removes the existing `library.db` file.

## 6. Start the Backend Server

From inside the `backend/` folder, run:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend API docs:

```text
http://127.0.0.1:8000/docs
```

Keep this terminal open while using the app.

## 7. Frontend Setup

Open a second terminal and go to the frontend folder:

```powershell
cd C:\library_management\frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

Open the app:

```text
http://localhost:5173
```

The frontend is configured to call the backend at:

```text
http://127.0.0.1:8000
```

## 8. First Login and Book Import

1. Open `http://localhost:5173`.
2. Log in with the default admin account.
3. Go to the admin dashboard.
4. Upload the library Excel accession register, or add books manually.
5. Create student/faculty users from the signup page.

Student and faculty signup currently requires a `@cbit.edu.in` email address.

## 9. Useful Commands

Backend:

```powershell
cd C:\library_management\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd C:\library_management\frontend
npm run dev
```

Build frontend:

```powershell
cd C:\library_management\frontend
npm run build
```

Inspect database:

```powershell
cd C:\library_management\backend
python inspect_db.py
```

Check Excel headers:

```powershell
cd C:\library_management\backend
python check_headers.py
```

## 10. Troubleshooting

### Pylance says `gspread` could not be resolved

Make sure VS Code is using:

```text
C:\library_management\backend\venv\Scripts\python.exe
```

You can set it from:

```text
Ctrl+Shift+P -> Python: Select Interpreter
```

Then reload VS Code.

### Backend dependency errors

Activate the backend virtual environment and reinstall requirements:

```powershell
cd C:\library_management\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend network errors

Confirm the backend is running:

```text
http://127.0.0.1:8000/docs
```

If that page does not open, restart the backend server.

### Excel upload fails

Make sure you installed backend dependencies from `requirements.txt`. The Excel upload needs packages such as `pandas`, `openpyxl`, and `xlrd`.

### Google Sheet errors

Check these:

- `backend/credentials.json` exists.
- The Google Sheet is named `CBIT Library Data`.
- The worksheet/tab is named `Acc.Reg`.
- The sheet is shared with the service account email.

## 11. Files Not to Share Publicly

Do not upload or share these files publicly:

- `backend/.env`
- `backend/credentials.json`
- `backend/library.db`, if it contains real data
- `backend/uploads/`, if it contains real user photos
- Real Excel files containing library or user data
