import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# 1. Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def find_header_row(df):
    """
    Scans for the header row.
    Priority 1: 'Acc' (Standard sheets)
    Priority 2: 'Title' + 'Author' (Extra Books sheet which lacks Acc No)
    """
    for i, row in df.iterrows():
        row_str = " ".join(row.astype(str).values).lower()
        
        # Standard Sheets
        if "acc" in row_str and "title" in row_str:
            return i
        # "Extra Books" Sheet (Has S.No, Title, Author but no Acc)
        if "title" in row_str and "author" in row_str:
            return i
            
    return None

def clean_text(val):
    s = str(val).strip()
    if s.lower() in ['nan', 'nat', 'none', '', '0', '0.0']:
        return None
    return s

def seed_data():
    db = SessionLocal()
    file_path = "C:\\library_management\\backend\CBIT ACC Register- as on 28.08.25.xls"
    
    try:
        xls = pd.ExcelFile(file_path)
    except FileNotFoundError:
        print(f"❌ File not found at: {file_path}")
        return

    total_books_added = 0

    for sheet_name in xls.sheet_names:
        print(f"📥 Processing Sheet: {sheet_name}")
        
        try:
            # 1. Find Header
            df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None, nrows=20)
            header_idx = find_header_row(df_raw)
            
            if header_idx is None:
                print(f"   ⚠️ Skipping {sheet_name}: No valid header found.")
                continue

            # 2. Read Data
            df = pd.read_excel(xls, sheet_name=sheet_name, header=header_idx)
            df.columns = df.columns.astype(str).str.replace(r'[^\w]', '', regex=True).str.lower()
            
            count = 0
            for index, row in df.iterrows():
                # 3. Find or Generate Acc No
                acc = None
                for col in df.columns:
                    if 'acc' in col or 'accession' in col:
                        acc = clean_text(row.get(col))
                        if acc: break
                
                # FIX: If no Acc No (like in Extra Books), generate one using Sheet Name + S.No
                if not acc:
                    s_no = row.get('sno') or row.get('slno') or (index + 1)
                    acc = f"{sheet_name}-{s_no}"

                title = clean_text(row.get('titleofthebook') or row.get('title') or 'Unknown')
                
                # 4. Get Copy Count
                raw_copies = row.get('noofcopies') or row.get('copies') or row.get('nos')
                try:
                    num_copies = int(float(raw_copies))
                    if num_copies < 1: num_copies = 1
                except:
                    num_copies = 1 

                author = clean_text(row.get('author') or 'Unknown')
                publisher = clean_text(row.get('publisher') or row.get('place') or row.get('placepublisher'))
                year = clean_text(row.get('year') or row.get('edition'))
                pages = clean_text(row.get('pages'))
                call_no = clean_text(row.get('callno') or row.get('classno'))
                
                # 5. Add to DB
                new_book = models.Book(
                    acc_no=acc,
                    title=title,
                    author=author,
                    department=sheet_name,
                    publisher=publisher,
                    edition_year=year,
                    pages=pages,
                    call_no=call_no,
                    total_copies=num_copies,
                    available_copies=num_copies
                )
                db.add(new_book)
                count += 1
            
            db.commit()
            print(f"   ✅ Added {count} entries from {sheet_name}")
            total_books_added += count

        except Exception as e:
            print(f"   ❌ Error in {sheet_name}: {e}")

    db.close()
    print(f"\n🎉 Seeding Completed! Total Rows: {total_books_added}")

if __name__ == "__main__":
    seed_data()