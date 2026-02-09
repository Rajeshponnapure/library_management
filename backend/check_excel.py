import pandas as pd

# REPLACE THIS with your actual excel file name
excel_file = "CBIT ACC Register- as on 28.08.25.xls" 

try:
    # Read the file
    df = pd.read_excel(excel_file)
    
    print("\n--- 📊 EXCEL COLUMN HEADERS ---")
    print("Copy these names exactly into your main.py upload function:")
    print("---------------------------------------------------------")
    print(list(df.columns))
    print("---------------------------------------------------------")
    
    # Print first row to verify data
    print("\n--- FIRST ROW DATA ---")
    print(df.iloc[0])

except Exception as e:
    print(f"Error reading Excel: {e}")