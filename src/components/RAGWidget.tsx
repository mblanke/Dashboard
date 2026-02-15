"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, CheckCircle, XCircle, FileText, Layers } from "lucide-react";

interface RAGData {
  processed: number;
  failed: number;
  totalChunks: number;
  ingest: {
    running: boolean;
    total: number;
    done: number;
    failed: number;
    currentFile: string;
    skipped: number;
  };
}

export default function RAGWidget() {
  const [data, setData] = useState<RAGData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/rag");
        if (!res.ok) throw new Error();
        setData(await res.json());
        setError(false);
      } catch {
        setError(true);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <XCircle className="w-4 h-4" />
          <span>RAG API unreachable</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 animate-pulse">
        <div className="h-20 bg-gray-700/50 rounded" />
      </div>
    );
  }

  const { processed, failed, totalChunks, ingest } = data;
  const pct = ingest.total > 0 ? Math.round(((ingest.done + ingest.failed) / ingest.total) * 100) : 0;
  const shortFile = ingest.currentFile ? ingest.currentFile.split("/").pop()?.slice(0, 45) : "";

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">RAG Pipeline</h3>
        </div>
        {ingest.running && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Ingesting
          </span>
        )}
        {!ingest.running && (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Idle
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-0.5">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-white">{processed.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Files</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-white">{totalChunks.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Chunks</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-400 mb-0.5">
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-white">{failed}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Failed</div>
        </div>
      </div>

      {/* Progress bar (shows when ingesting) */}
      {ingest.running && ingest.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{ingest.done + ingest.failed}/{ingest.total}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {shortFile && (
            <div className="text-[10px] text-gray-500 truncate" title={ingest.currentFile}>
              {shortFile}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
