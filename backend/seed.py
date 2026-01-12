import pandas as pd
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

EXCEL_FILE = "CBIT ACC Register- as on 28.08.25.xls"

def import_books_from_sheet(sheet_name):
    db = SessionLocal()
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name, skiprows=4)
        df.columns = df.columns.str.strip()

        print(f"📥 Importing sheet: {sheet_name}")

        for _, row in df.iterrows():
            if pd.isna(row.get("Acc.NO")):
                continue

            total = int(row["No.of Copies"]) if pd.notna(row.get("No.of Copies")) else 1

            book = models.Book(
                acc_no=str(row.get("Acc.NO")),
                author=str(row.get("Author")),
                title=str(row.get("Title")),
                department=sheet_name,
                total_copies=total,
                available_copies=total,
                edition_year=str(row.get("Edition/Year")),
                pages=str(row.get("Pages")),
                volume=str(row.get("Volume")),
                publisher=str(row.get("Publisher")),
                source=str(row.get("Sources")),
                bill_no_date=str(row.get("Bill No & Date")),
                cost=str(row.get("Cost"))
            )

            db.add(book)

        db.commit()
        print(f"✅ Finished sheet: {sheet_name}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error in sheet {sheet_name}: {e}")
    finally:
        db.close()


xls = pd.ExcelFile(EXCEL_FILE)
for sheet in xls.sheet_names:
    import_books_from_sheet(sheet)
