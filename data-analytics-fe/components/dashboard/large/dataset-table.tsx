"use client";

import React, { useState, useEffect } from "react";
import { IoChevronBack, IoChevronForward, IoChevronDown, IoDocumentOutline, IoDownloadOutline } from "react-icons/io5";

interface DatasetTableProps {
  reportId: string;
}

interface TableInfo {
  name: string;
  label: string;
  description: string;
  sizeBytes: number;
}

interface PaginatedData {
  columns: string[];
  rows: any[][];
  totalCount: number;
  page: number;
  pageSize: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetTable({ reportId }: DatasetTableProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<string>("raw_data");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const [data, setData] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    const fetchTables = async () => {
      setTablesLoading(true);
      setTablesError(null);
      try {
        const res = await fetch(`/api/report/${reportId}/tables`);
        if (!res.ok) throw new Error("Failed to fetch available datasets");
        const result = await res.json();
        const list: TableInfo[] = result.tables ?? [];
        setTables(list);
        const defaultTable = list.find((t) => t.name === "raw_data") ?? list[0];
        if (defaultTable) setSelectedTable(defaultTable.name);
      } catch (err) {
        setTablesError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setTablesLoading(false);
      }
    };
    fetchTables();
  }, [reportId]);

  useEffect(() => {
    if (!reportId || tablesLoading || !selectedTable) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/report/${reportId}/data?page=${page}&pageSize=${pageSize}&table=${encodeURIComponent(selectedTable)}`
        );
        if (!res.ok) throw new Error("Failed to fetch dataset preview");
        const result: PaginatedData = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, selectedTable, page, tablesLoading]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const activeTableInfo = tables.find((t) => t.name === selectedTable);

  const handleSelectTable = (name: string) => {
    if (name !== selectedTable) {
      setSelectedTable(name);
      setPage(1);
      setData(null);
    }
    setIsSelectOpen(false);
  };

  const handleExportCsv = async () => {
    if (!reportId || !selectedTable || isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch(
        `/api/report/${reportId}/data?page=1&pageSize=100000&table=${encodeURIComponent(selectedTable)}`
      );
      if (!res.ok) throw new Error("Failed to fetch data for export");
      const result: PaginatedData = await res.json();

      const escape = (v: unknown): string => {
        const str = v == null ? "" : String(v);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvLines = [
        result.columns.map(escape).join(","),
        ...result.rows.map((row) => row.map(escape).join(",")),
      ];
      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTable}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      alert("CSV export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* Header: Title + Dataset Selector + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Dataset Preview</h3>
          {activeTableInfo?.description && (
            <p className="text-xs mt-0.5 max-w-md" style={{ color: "var(--text-muted)" }}>{activeTableInfo.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dataset select box */}
          <div className="relative">
            {tablesLoading ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)", color: "var(--text-secondary)" }}
              >
                <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--text-muted)" }} />
                <span>Loading datasets…</span>
              </div>
            ) : tablesError ? (
              <div className="px-3 py-2 rounded-lg border border-red-800/60 bg-red-900/20 text-red-400 text-xs">
                {tablesError}
              </div>
            ) : tables.length === 0 ? (
              <div
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)", color: "var(--text-muted)" }}
              >
                No datasets available
              </div>
            ) : (
              <>
                <button
                  id="dataset-selector-btn"
                  onClick={() => setIsSelectOpen((o) => !o)}
                  className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border hover:border-primary/60 transition-all text-sm min-w-[180px] justify-between"
                  style={{
                    borderColor: "var(--surface-border)",
                    background: "var(--surface-inset)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <IoDocumentOutline size={15} className="text-primary shrink-0" />
                    <span className="truncate max-w-[140px]">
                      {activeTableInfo?.label ?? selectedTable}
                    </span>
                  </div>
                  <IoChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${isSelectOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--text-secondary)" }}
                  />
                </button>

                {/* Dropdown */}
                {isSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSelectOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-1.5 z-20 w-72 rounded-xl border shadow-2xl overflow-hidden"
                      style={{
                        background: "var(--surface-card)",
                        borderColor: "var(--surface-border)",
                      }}
                    >
                      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--surface-border)" }}>
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          Available Datasets
                        </p>
                      </div>
                      <ul className="py-1 max-h-64 overflow-y-auto">
                        {tables.map((t) => (
                          <li key={t.name}>
                            <button
                              id={`dataset-option-${t.name}`}
                              onClick={() => handleSelectTable(t.name)}
                              className={`w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3 group ${
                                t.name === selectedTable ? "bg-primary/10" : ""
                              }`}
                              style={t.name !== selectedTable ? { color: "var(--text-secondary)" } : undefined}
                              onMouseEnter={(e) => { if (t.name !== selectedTable) e.currentTarget.style.background = "var(--surface-inset)"; }}
                              onMouseLeave={(e) => { if (t.name !== selectedTable) e.currentTarget.style.background = ""; }}
                            >
                              <IoDocumentOutline
                                size={15}
                                className={`mt-0.5 shrink-0 ${t.name === selectedTable ? "text-primary" : ""}`}
                                style={t.name !== selectedTable ? { color: "var(--text-muted)" } : undefined}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-sm font-medium truncate ${t.name === selectedTable ? "text-primary" : ""}`}
                                    style={t.name !== selectedTable ? { color: "var(--text-primary)" } : undefined}
                                  >
                                    {t.label}
                                  </span>
                                  {t.sizeBytes > 0 && (
                                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                                      {formatBytes(t.sizeBytes)}
                                    </span>
                                  )}
                                </div>
                                {t.description && (
                                  <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting || !data || data.rows.length === 0}
            className="flex items-center gap-2 pl-3 pr-3 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 hover:bg-primary/10 hover:text-white"
            style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--text-muted)" }} />
            ) : (
              <IoDownloadOutline size={15} />
            )}
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {data && !loading && (
        <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>
            <strong style={{ color: "var(--text-secondary)" }}>{data.totalCount.toLocaleString()}</strong> total rows
          </span>
          <span>·</span>
          <span>
            <strong style={{ color: "var(--text-secondary)" }}>{data.columns.length}</strong> columns
          </span>
          {activeTableInfo?.sizeBytes ? (
            <>
              <span>·</span>
              <span>
                <strong style={{ color: "var(--text-secondary)" }}>{formatBytes(activeTableInfo.sizeBytes)}</strong>
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Table Area */}
      <div
        className="flex-1 overflow-auto rounded-xl backdrop-blur-sm min-h-[400px] border"
        style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-full">
            <div className="flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-secondary)" }}>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading dataset…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 sm:h-full text-red-400 text-sm p-4 text-center">
            {error}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex items-center justify-center h-48 sm:h-full text-sm" style={{ color: "var(--text-secondary)" }}>
            No data found.
          </div>
        ) : (
          <table className="w-full text-left text-sm" style={{ color: "var(--text-secondary)" }}>
            <thead
              className="sticky top-0 z-10 border-b shadow-sm"
              style={{ background: "var(--surface-deep)", borderColor: "var(--surface-border)" }}
            >
              <tr>
                <th
                  className="px-4 py-3 font-medium w-16 text-center border-r"
                  style={{ color: "var(--text-muted)", borderColor: "var(--surface-border)" }}
                >
                  #
                </th>
                {data.columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 font-medium whitespace-nowrap border-r transition-colors"
                    style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b transition-colors"
                  style={{ borderColor: "var(--surface-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-card)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td
                    className="px-4 py-2 text-center font-mono text-xs border-r"
                    style={{ color: "var(--text-muted)", borderColor: "var(--surface-border)" }}
                  >
                    {(page - 1) * pageSize + rowIndex + 1}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate border-r"
                      style={{ borderColor: "var(--surface-border)" }}
                      title={cell != null ? String(cell) : ""}
                    >
                      {cell == null ? (
                        <span className="italic" style={{ color: "var(--text-muted)" }}>null</span>
                      ) : typeof cell === "boolean" ? (
                        cell ? "true" : "false"
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {data ? (
            <span>
              Showing{" "}
              <strong style={{ color: "var(--text-primary)" }}>{(page - 1) * pageSize + 1}</strong> to{" "}
              <strong style={{ color: "var(--text-primary)" }}>{Math.min(page * pageSize, data.totalCount)}</strong>{" "}
              of <strong style={{ color: "var(--text-primary)" }}>{data.totalCount}</strong> entries
            </span>
          ) : (
            <span>Loading entries…</span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center justify-center p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:border-primary/50"
            style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
            aria-label="Previous page"
          >
            <IoChevronBack size={18} />
          </button>

          <div
            className="flex items-center justify-center px-4 rounded-lg border text-sm font-medium"
            style={{ background: "var(--surface-inset)", borderColor: "var(--surface-border)", color: "var(--text-primary)" }}
          >
            Page {page} {totalPages > 0 && `of ${totalPages}`}
          </div>

          <button
            onClick={() => setPage((p) => (totalPages && p < totalPages ? p + 1 : p))}
            disabled={(!totalPages || page === totalPages) || loading}
            className="flex items-center justify-center p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:border-primary/50"
            style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
            aria-label="Next page"
          >
            <IoChevronForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
