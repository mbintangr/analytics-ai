"use client";

import React, { useState, useEffect } from "react";
import { IoChevronBack, IoChevronForward, IoChevronDown, IoDocumentOutline } from "react-icons/io5";

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

  // Step 1: Fetch available tables
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
        // Default to raw_data if available, else first table
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

  // Step 2: Fetch paginated data when table or page changes
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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* Header: Title + Dataset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Dataset Preview</h3>
          {activeTableInfo?.description && (
            <p className="text-xs text-slate-500 mt-0.5 max-w-md">{activeTableInfo.description}</p>
          )}
        </div>

        {/* Dataset select box */}
        <div className="relative shrink-0">
          {tablesLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-sm">
              <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading datasets…</span>
            </div>
          ) : tablesError ? (
            <div className="px-3 py-2 rounded-lg border border-red-800/60 bg-red-900/20 text-red-400 text-xs">
              {tablesError}
            </div>
          ) : tables.length === 0 ? (
            <div className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-500 text-sm">
              No datasets available
            </div>
          ) : (
            <>
              <button
                id="dataset-selector-btn"
                onClick={() => setIsSelectOpen((o) => !o)}
                className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-primary/60 hover:bg-slate-800 transition-all text-sm text-white min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <IoDocumentOutline size={15} className="text-primary shrink-0" />
                  <span className="truncate max-w-[140px]">
                    {activeTableInfo?.label ?? selectedTable}
                  </span>
                </div>
                <IoChevronDown
                  size={14}
                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${isSelectOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              {isSelectOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSelectOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Available Datasets
                      </p>
                    </div>
                    <ul className="py-1 max-h-64 overflow-y-auto">
                      {tables.map((t) => (
                        <li key={t.name}>
                          <button
                            id={`dataset-option-${t.name}`}
                            onClick={() => handleSelectTable(t.name)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors flex items-start gap-3 group ${
                              t.name === selectedTable ? "bg-primary/10" : ""
                            }`}
                          >
                            <IoDocumentOutline
                              size={15}
                              className={`mt-0.5 shrink-0 ${t.name === selectedTable ? "text-primary" : "text-slate-500 group-hover:text-slate-300"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-sm font-medium truncate ${
                                    t.name === selectedTable ? "text-primary" : "text-slate-200"
                                  }`}
                                >
                                  {t.label}
                                </span>
                                {t.sizeBytes > 0 && (
                                  <span className="text-xs text-slate-600 shrink-0">
                                    {formatBytes(t.sizeBytes)}
                                  </span>
                                )}
                              </div>
                              {t.description && (
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
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
      </div>

      {/* Stats bar */}
      {data && !loading && (
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          <span>
            <strong className="text-slate-300">{data.totalCount.toLocaleString()}</strong> total rows
          </span>
          <span>·</span>
          <span>
            <strong className="text-slate-300">{data.columns.length}</strong> columns
          </span>
          {activeTableInfo?.sizeBytes ? (
            <>
              <span>·</span>
              <span>
                <strong className="text-slate-300">{formatBytes(activeTableInfo.sizeBytes)}</strong>
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Table Area */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-full">
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading dataset…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 sm:h-full text-red-400 text-sm p-4 text-center">
            {error}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex items-center justify-center h-48 sm:h-full text-slate-400 text-sm">
            No data found.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-400 w-16 text-center border-r border-slate-800/50">
                  #
                </th>
                {data.columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 font-medium whitespace-nowrap border-r border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 text-center text-slate-500 font-mono text-xs border-r border-slate-800/50">
                    {(page - 1) * pageSize + rowIndex + 1}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate border-r border-slate-800/50"
                      title={cell != null ? String(cell) : ""}
                    >
                      {cell == null ? (
                        <span className="text-slate-600 italic">null</span>
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
        <div className="text-sm text-slate-400">
          {data ? (
            <span>
              Showing{" "}
              <strong className="text-white">{(page - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-white">{Math.min(page * pageSize, data.totalCount)}</strong>{" "}
              of <strong className="text-white">{data.totalCount}</strong> entries
            </span>
          ) : (
            <span>Loading entries…</span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <IoChevronBack size={18} />
          </button>

          <div className="flex items-center justify-center px-4 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium">
            Page {page} {totalPages > 0 && `of ${totalPages}`}
          </div>

          <button
            onClick={() => setPage((p) => (totalPages && p < totalPages ? p + 1 : p))}
            disabled={(!totalPages || page === totalPages) || loading}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <IoChevronForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
