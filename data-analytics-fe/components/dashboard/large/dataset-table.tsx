"use client";

import React, { useState, useEffect } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface DatasetTableProps {
  reportId: string;
}

interface PaginatedData {
  columns: string[];
  rows: any[][];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function DatasetTable({ reportId }: DatasetTableProps) {
  const [data, setData] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/report/${reportId}/data?page=${page}&pageSize=${pageSize}`);
        if (!res.ok) {
          throw new Error("Failed to fetch dataset preview");
        }
        const result: PaginatedData = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, page, pageSize]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Dataset Preview</h3>
        {data && (
          <span className="text-sm text-slate-400">
            Total records: <strong className="text-white">{data.totalCount.toLocaleString()}</strong>
          </span>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-full">
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading dataset...</span>
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
                <th className="px-4 py-3 font-medium text-slate-400 w-16 text-center border-r border-slate-800/50">#</th>
                {data.columns.map((col, index) => (
                  <th key={index} className="px-4 py-3 font-medium whitespace-nowrap border-r border-slate-800/50 hover:bg-slate-800/50 transition-colors">
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
                    <td key={cellIndex} className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate border-r border-slate-800/50" title={cell != null ? String(cell) : ""}>
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
              Showing <strong className="text-white">{(page - 1) * pageSize + 1}</strong> to <strong className="text-white">{Math.min(page * pageSize, data.totalCount)}</strong> of <strong className="text-white">{data.totalCount}</strong> entries
            </span>
          ) : (
            <span>Loading entries...</span>
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
