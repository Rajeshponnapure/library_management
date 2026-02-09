import pandas as pd

# Update this to your actual file name
file_path = "CBIT ACC Register- as on 28.08.25.xls" 

try:
    # Read the first sheet to get headers
    df = pd.read_excel(file_path)
    print("--- YOUR EXCEL HEADERS ---")
    print(list(df.columns))
except Exception as e:
    print(f"Error: {e}")