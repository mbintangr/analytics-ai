import duckdb
import os
import json
import numpy as np
import datetime


class DuckDBEngine:
    def __init__(self):
        self._conn = None
        self._registered_tables = {}

    @property
    def conn(self):
        if self._conn is None:
            self._conn = duckdb.connect()
            for name, path in self._registered_tables.items():
                self._register_in_duckdb(name, path)
        return self._conn

    def _register_in_duckdb(self, name: str, path: str):
        safe_path = path.replace("\\", "/")
        self._conn.execute(
            f'CREATE OR REPLACE VIEW "{name}" AS SELECT * FROM \'{safe_path}\''
        )

    def register_parquet(self, table_name: str, parquet_path: str):
        self._registered_tables[table_name] = parquet_path
        if self._conn is not None:
            self._register_in_duckdb(table_name, parquet_path)

    def execute_query(self, sql: str, max_rows: int = 1000) -> dict:
        result = self.conn.execute(sql)
        if result.description is None:
            return {"columns": [], "rows": [], "row_count": 0, "truncated": False, "message": "Query executed successfully."}

        columns = [desc[0] for desc in result.description]
        rows = result.fetchmany(max_rows + 1)

        truncated = len(rows) > max_rows
        if truncated:
            rows = rows[:max_rows]

        sanitized_rows = []
        for row in rows:
            sanitized_row = []
            for val in row:
                if val is None:
                    sanitized_row.append(None)
                elif isinstance(val, (np.integer,)):
                    sanitized_row.append(int(val))
                elif isinstance(val, (np.floating,)):
                    sanitized_row.append(None if np.isinf(val) else float(val))
                elif isinstance(val, (np.bool_,)):
                    sanitized_row.append(bool(val))
                elif isinstance(val, (datetime.date, datetime.datetime)):
                    sanitized_row.append(val.isoformat())
                elif isinstance(val, float):
                    if val != val:
                        sanitized_row.append(None)
                    elif abs(val) == float("inf"):
                        sanitized_row.append(None)
                    else:
                        sanitized_row.append(val)
                else:
                    sanitized_row.append(val)
            sanitized_rows.append(sanitized_row)

        return {
            "columns": columns,
            "rows": sanitized_rows,
            "row_count": len(sanitized_rows),
            "truncated": truncated,
        }

    def query_to_df(self, sql: str):
        return self.conn.execute(sql).fetchdf()

    def get_table_list(self) -> list[str]:
        return list(self._registered_tables.keys())

    def get_table_schema(self, table_name: str) -> list[dict]:
        result = self.conn.execute(f'DESCRIBE "{table_name}"')
        return [{"name": row[0], "type": row[1]} for row in result.fetchall()]

    def save_query_as_parquet(self, sql: str, output_path: str) -> str:
        safe_path = output_path.replace("\\", "/")
        self.conn.execute(f"COPY ({sql}) TO '{safe_path}' (FORMAT PARQUET)")
        return output_path

    def get_table_path(self, table_name: str) -> str | None:
        return self._registered_tables.get(table_name)

    def close(self):
        if self._conn:
            try:
                self._conn.close()
                self._conn = None
            except Exception:
                pass

    def __getstate__(self):
        state = self.__dict__.copy()
        state["_conn"] = None
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._conn = None
