import sqlite3
import csv
import os
import glob
import collections
from pathlib import Path

def export_merged_components(cursor, db_out_dir, tables):
    """Finds related tables via foreign keys and exports them as a single merged CSV."""
    table_cols = {}
    for t in tables:
        cursor.execute(f"PRAGMA table_info('{t}');")
        table_cols[t] = [row[1] for row in cursor.fetchall()]

    fks = []
    for t in tables:
        cursor.execute(f"PRAGMA foreign_key_list('{t}');")
        for row in cursor.fetchall():
            fk_id = row[0]
            to_table = row[2]
            from_col = row[3]
            to_col = row[4]
            if to_col is None:
                continue
            fks.append((t, to_table, from_col, to_col, fk_id))

    fk_groups = collections.defaultdict(list)
    for from_t, to_t, from_c, to_c, fk_id in fks:
        fk_groups[(from_t, to_t, fk_id)].append((from_c, to_c))

    adj = collections.defaultdict(list)
    for (from_t, to_t, fk_id), cols in fk_groups.items():
        adj[from_t].append((to_t, cols, from_t, to_t))
        adj[to_t].append((from_t, cols, from_t, to_t))

    visited = set()
    components = []
    for t in tables:
        if t not in visited:
            comp_tables = []
            comp_edges = []
            q = [t]
            visited.add(t)
            while q:
                curr = q.pop(0)
                comp_tables.append(curr)
                for neighbor, cols, from_t, to_t in adj[curr]:
                    edge = (from_t, to_t, tuple(cols))
                    if edge not in comp_edges:
                        comp_edges.append(edge)
                    if neighbor not in visited:
                        visited.add(neighbor)
                        q.append(neighbor)
            components.append((comp_tables, comp_edges))

    for i, (comp_tables, comp_edges) in enumerate(components):
        if len(comp_tables) <= 1:
            continue # No need to merge a single table
            
        select_items = []
        for t in comp_tables:
            for c in table_cols[t]:
                select_items.append(f'"{t}"."{c}" AS "{t}_{c}"')
                
        base_table = comp_tables[0]
        from_clause = f'"{base_table}"'
        
        joined = {base_table}
        edges_to_process = list(comp_edges)
        
        while edges_to_process:
            progress = False
            for edge in edges_to_process[:]:
                from_t, to_t, cols = edge
                if from_t in joined and to_t in joined:
                    edges_to_process.remove(edge)
                    continue
                    
                if from_t in joined or to_t in joined:
                    new_t = to_t if from_t in joined else from_t
                    on_conditions = [f'"{from_t}"."{fc}" = "{to_t}"."{tc}"' for fc, tc in cols]
                    from_clause += f' FULL OUTER JOIN "{new_t}" ON {" AND ".join(on_conditions)}'
                    joined.add(new_t)
                    edges_to_process.remove(edge)
                    progress = True
                    
            if not progress:
                break
                
        query = f"SELECT {', '.join(select_items)} FROM {from_clause}"
        
        try:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            csv_path = os.path.join(db_out_dir, f"merged_component_{i+1}.csv")
            
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if cursor.description:
                    writer.writerow([d[0] for d in cursor.description])
                writer.writerows(rows)
        except Exception as e:
            print(f"Failed to export merged component {i+1} for {db_out_dir}: {repr(e)}")

def sqlite_to_csv(db_path: str, output_base_dir: str):
    """Converts all tables in an SQLite database to CSV files and merges related tables."""
    try:
        conn = sqlite3.connect(db_path)
        conn.text_factory = lambda b: b.decode(errors='replace')
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall() if not t[0].startswith('sqlite_')]
        
        db_name = Path(db_path).stem
        db_out_dir = os.path.join(output_base_dir, db_name)
        os.makedirs(db_out_dir, exist_ok=True)
        
        for table_name in tables:
            cursor.execute(f'SELECT * FROM "{table_name}"')
            rows = cursor.fetchall()
            
            csv_path = os.path.join(db_out_dir, f"{table_name}.csv")
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if cursor.description:
                    writer.writerow([description[0] for description in cursor.description])
                writer.writerows(rows)
                
        export_merged_components(cursor, db_out_dir, tables)
                
    except Exception as e:
        print(f"Error processing {db_path}: {repr(e)}")
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.join(base_dir, "datasets", "nvbench")
    
    if not os.path.exists(datasets_dir):
        print(f"Directory not found: {datasets_dir}")
        return

    output_dir = os.path.join(base_dir, "datasets", "nvbench_csv")
    os.makedirs(output_dir, exist_ok=True)
    
    sqlite_files = glob.glob(os.path.join(datasets_dir, "**", "*.sqlite"), recursive=True)
    
    if not sqlite_files:
        print(f"No .sqlite files found in {datasets_dir}")
        return
        
    print(f"Found {len(sqlite_files)} .sqlite files in {datasets_dir}")
    
    for db_path in sqlite_files:
        print(f"Processing {os.path.basename(db_path)}...")
        sqlite_to_csv(db_path, output_dir)
        
    print(f"Finished. CSV files are saved in {output_dir}")

if __name__ == "__main__":
    main()