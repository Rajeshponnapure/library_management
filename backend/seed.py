import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# 1. Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def find_header_row(df, sheet_name):
    """
    Scans the first 20 rows with increasing desperation.
    """
    # Pass 1: Standard Match (Acc + Title)
    for i, row in df.iterrows():
        row_str = " ".join(row.astype(str).values).lower()
        if "acc" in row_str and "title" in row_str:
            return i
            
    # Pass 2: Loose Match (Acc + No/Num)
    for i, row in df.iterrows():
        row_str = " ".join(row.astype(str).values).lower()
        if "acc" in row_str and ("no" in row_str or "num" in row_str):
            return i

    # Pass 3: Desperate Match (Just "Acc" or "S.No")
    for i, row in df.iterrows():
        row_str = " ".join(row.astype(str).values).lower()
        if "acc" in row_str or "accession" in row_str or "s.no" in row_str:
            return i
            
    return None

def clean_text(val):
    s = str(val).strip()
    if s.lower() in ['nan', 'nat', 'none', '', '0', '0.0']:
        return None
    return s

def seed_data():
    db = SessionLocal()
    file_path = "C:/Users/saimo/library-system/backend/CBIT ACC Register- as on 28.08.25.xls"
    
    try:
        xls = pd.ExcelFile(file_path)
    except FileNotFoundError:
        print(f"❌ File not found at: {file_path}")
        return

    total_books_added = 0

    for sheet_name in xls.sheet_names:
        print(f"📥 Processing Sheet: {sheet_name}")
        
        try:
            # 1. Read first 20 rows to find header
            df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None, nrows=20)
            header_idx = find_header_row(df_raw, sheet_name)
            
            if header_idx is None:
                print(f"   ⚠️ Skipping {sheet_name}: Header not found.")
                print(f"   🔎 HERE IS WHAT THE FIRST 5 ROWS LOOK LIKE:")
                print(df_raw.head(5)) # <--- DEBUG PRINT
                continue

            # 2. Load Data
            df = pd.read_excel(xls, sheet_name=sheet_name, header=header_idx)
            
            # 3. Clean Column Names
            df.columns = df.columns.astype(str).str.replace(r'[^\w]', '', regex=True).str.lower()
            
            count = 0
            for index, row in df.iterrows():
                # 4. Extract Data (Look for any column starting with 'acc' or 'sl')
                acc = None
                for col in df.columns:
                    if 'acc' in col or 'slno' in col or 'sno' in col:
                        acc = clean_text(row.get(col))
                        if acc: break
                
                if not acc: continue 

                title = clean_text(row.get('titleofthebook') or row.get('title') or 'Unknown')
                author = clean_text(row.get('author') or 'Unknown')
                publisher = clean_text(row.get('publisher') or row.get('place') or row.get('placepublisher'))
                year = clean_text(row.get('year') or row.get('edition'))
                pages = clean_text(row.get('pages'))
                date_acq = clean_text(row.get('date'))
                call_no = clean_text(row.get('callno') or row.get('classno'))
                remarks = clean_text(row.get('remarks'))
                
                raw_price = row.get('cost') or row.get('price')
                try: price = float(raw_price)
                except: price = 0.0

                # 5. Add to DB
                new_book = models.Book(
                    acc_no=acc,
                    title=title,
                    author=author,
                    department=sheet_name,
                    publisher=publisher,
                    edition_year=year,
                    price=price,
                    pages=pages,
                    acquisition_date=date_acq,
                    call_no=call_no,
                    remarks=remarks,
                    total_copies=1,
                    available_copies=1
                )
                db.add(new_book)
                count += 1
            
            db.commit()
            print(f"   ✅ Added {count} books from {sheet_name} (Header at Row {header_idx + 1})")
            total_books_added += count

        except Exception as e:
            print(f"   ❌ Error in {sheet_name}: {e}")

    db.close()
    print(f"\n🎉 Seeding Completed! Total Books: {total_books_added}")

if __name__ == "__main__":
    seed_data()