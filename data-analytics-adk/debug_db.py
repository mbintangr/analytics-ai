import psycopg2
from config import DATABASE_URL

def list_tables():
    try:
        print(f"Connecting to: {DATABASE_URL}")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cur.fetchall()
        print("\n--- Tables in Database ---")
        if not tables:
            print("No tables found in public schema.")
        for table in tables:
            print(f"- {table[0]}")
        print("--------------------------\n")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables()
