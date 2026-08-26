'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

interface FileCategoryItem {
  id: string;
  category: string;
  label: string;
}

interface LogItem {
  time: string;
  message: string;
  type: 'success' | 'process' | 'error' | 'info';
}

interface SyncJobRow {
  id: string;
  category: string;
  targetSheet: string;
  period: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  rowsTotal: number | null;
  rowsDone: number | null;
  attempts: number | null;
  error: string | null;
}

const FILE_CATEGORIES: FileCategoryItem[] = [
  { id: 'fileHSI', category: 'HSI', label: 'HSI' },
  { id: 'fileDATIN', category: 'DATIN', label: 'DATIN' },
  { id: 'fileSIPTRUNK', category: 'SIP TRUNK', label: 'SIP TRUNK' },
  { id: 'fileDWDM', category: 'DWDM', label: 'DWDM' },
  { id: 'fileWIFI', category: 'WIFI', label: 'WIFI' },
  { id: 'fileSQMHSI', category: 'SQM HSI', label: 'SQM HSI' },
  { id: 'fileSQMDATIN', category: 'SQM DATIN', label: 'SQM DATIN' },
  { id: 'fileQHSI', category: 'Q HSI', label: 'Q HSI' },
  { id: 'fileQDATIN', category: 'Q DATIN', label: 'Q DATIN' },
];

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('Menunggu proses...');
  const [logs, setLogs] = useState<LogItem[]>([
    {
      time: new Date().toLocaleTimeString('id-ID'),
      message: 'Sistem siap memproses berkas Excel.',
      type: 'info',
    },
  ]);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const logAreaRef = useRef<HTMLDivElement>(null);
  const [syncJobs, setSyncJobs] = useState<SyncJobRow[]>([]);
  const [syncPolling, setSyncPolling] = useState<boolean>(false);

  useEffect(() => {
    if (!syncPolling) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/sheets/sync');
        const data = await res.json();
        if (stopped || !data?.success) return;
        const jobs: SyncJobRow[] = data.jobs || [];
        setSyncJobs(jobs);
        const active = jobs.some(j => j.status === 'pending' || j.status === 'running');
        if (!active) setSyncPolling(false);
      } catch {
        // biarkan poll berikutnya mencoba lagi
      }
    };
    const timer = setInterval(tick, 2500);
    void tick();
    return () => { stopped = true; clearInterval(timer); };
  }, [syncPolling]);

  const retrySync = async (category: string) => {
    addLog(`Menjadwalkan ulang mirror spreadsheet untuk ${category}...`, 'process');
    try {
      await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      setSyncPolling(true);
    } catch {
      addLog(`Gagal menjadwalkan ulang mirror ${category}.`, 'error');
    }
  };

  const addLog = (message: string, type: 'success' | 'process' | 'error' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs((prev) => [...prev, { time, message, type }]);
    setTimeout(() => {
      if (logAreaRef.current) {
        logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
      }
    }, 50);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleFileChange = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFiles((prev) => ({ ...prev, [category]: file }));
      addLog(`File dipilih untuk ${category}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'process');
    }
  };

  const handleUploadAll = async () => {
    const categoriesToUpload = Object.keys(selectedFiles).filter((cat) => selectedFiles[cat]);

    if (categoriesToUpload.length === 0) {
      alert('Pilih minimal satu file Excel');
      return;
    }

    setIsProcessing(true);
    setShowProgress(true);
    setProgressPercent(0);
    setProgressText('Menyiapkan antrian proses...');
    addLog(`Memulai upload & proses untuk ${categoriesToUpload.length} file antrian...`, 'process');

    const total = categoriesToUpload.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const cat = categoriesToUpload[i];
      const file = selectedFiles[cat];
      const current = i + 1;
      const queueLength = total - current;

      const currentPercent = Math.round(((i) / total) * 100);
      setProgressPercent(currentPercent);
      setProgressText(`${file.name}\nKategori : ${cat}\nProgres ${current}/${total} · Antrian: ${queueLength} file`);
      addLog(`[${current}/${total}] Mengunggah & membaca ${file.name} (${cat})...`, 'process');

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', cat);

        const res = await fetch('/api/kpi/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal memproses file');
        }

        successCount++;
        addLog(`Berhasil memproses ${data.processedRows} baris untuk ${cat} (${data.period}) dalam ${data.executionTimeMs}ms`, 'success');
      } catch (err) {
        addLog(`Gagal memproses ${cat}: ${(err as Error).message}`, 'error');
      }
    }

    setProgressPercent(100);
    setProgressText('Semua proses selesai');
    addLog(`Seluruh antrian selesai diproses: ${successCount} berhasil dari ${total} file.`, 'success');
    setIsProcessing(false);
    setSyncJobs([]);
    setSyncPolling(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">

        <div className="mb-7 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          Upload File Excel
        </h1>

        <p className="mx-auto mt-2 mb-8 max-w-md text-center text-sm font-medium text-slate-500">
          Pilih file sesuai kategori. Sistem akan memproses otomatis sesuai antrian.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FILE_CATEGORIES.map((item) => {
            const hasFile = Boolean(selectedFiles[item.category]);
            return (
              <div key={item.id} className="upload-card">
                <label>
                  <div className="title flex items-center justify-between">
                    <span>{item.label}</span>
                    {hasFile && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terpilih
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    id={item.id}
                    ref={(el) => {
                      fileInputRefs.current[item.id] = el;
                    }}
                    onChange={(e) => handleFileChange(item.category, e)}
                    accept=".xlsx,.xls,.csv"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <button
          id="uploadButton"
          type="button"
          onClick={handleUploadAll}
          disabled={isProcessing}
          className="mt-8 w-full cursor-pointer rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isProcessing ? 'Sedang Memproses Antrian...' : 'Upload & Proses Semua'}
        </button>

        {showProgress && (
          <div id="progressContainer" className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Progress</span>
              <span id="progressPercent" className="text-sm font-extrabold tracking-tight text-blue-600">
                {progressPercent}%
              </span>
            </div>

            <p id="progressText" className="mb-3 whitespace-pre-line text-xs font-medium leading-relaxed text-slate-600">
              {progressText}
            </p>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 ring-1 ring-inset ring-slate-200">
              <div
                id="progressBar"
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {syncJobs.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Mirror Spreadsheet
              </h3>
              {syncPolling && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  menyinkronkan...
                </span>
              )}
            </div>

            <ul className="space-y-2">
              {Object.values(
                syncJobs.reduce<Record<string, SyncJobRow>>((acc, j) => {
                  if (!acc[j.category]) acc[j.category] = j;
                  return acc;
                }, {})
              ).map((j) => {
                const pct = (j.status === 'running' || j.status === 'done')
                  ? Math.round(((j.rowsDone || 0) / Math.max(1, j.rowsTotal || 1)) * 100)
                  : 0;
                const color =
                  j.status === 'done' ? 'text-emerald-600'
                  : j.status === 'failed' ? 'text-red-500'
                  : j.status === 'running' ? 'text-blue-600'
                  : 'text-slate-400';
                return (
                  <li key={j.category} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700">
                        {j.category}
                        <span className={`ml-2 font-semibold ${color}`}>{j.status.toUpperCase()}</span>
                        {(j.status === 'running' || j.status === 'done') && (
                          <span className="ml-2 font-medium text-slate-400">{pct}% · {j.rowsDone}/{j.rowsTotal} baris</span>
                        )}
                      </div>
                      {j.error && (
                        <div className="truncate text-[11px] text-red-400" title={j.error}>{j.error}</div>
                      )}
                    </div>
                    {j.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => retrySync(j.category)}
                        className="shrink-0 cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Sync Ulang
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div id="logSection" className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Log Proses</h3>
            <button
              type="button"
              onClick={clearLogs}
              className="cursor-pointer text-xs font-bold text-red-500 transition hover:text-red-700"
            >
              Hapus
            </button>
          </div>

          <div
            id="logArea"
            ref={logAreaRef}
            className="h-72 space-y-1 overflow-y-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-300 ring-1 ring-inset ring-slate-900"
          >
            {logs.map((log, idx) => {
              let color = 'text-slate-300';
              if (log.type === 'success') color = 'text-emerald-400';
              if (log.type === 'process') color = 'text-amber-300';
              if (log.type === 'error') color = 'text-red-400';

              return (
                <div key={idx} className={`${color} py-0.5 leading-relaxed`}>
                  [{log.time}] {log.message}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style jsx>{`
        .upload-card label {
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 18px;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .upload-card label:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          box-shadow: 0 8px 28px -6px rgba(37, 99, 235, 0.15);
          transform: translateY(-2px);
        }

        .title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #334155;
        }

        .upload-card input {
          font-size: 12px;
          color: #64748b;
        }

        .upload-card input::file-selector-button {
          background: linear-gradient(to bottom, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 7px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          margin-right: 10px;
          transition: all 0.2s;
        }

        .upload-card input::file-selector-button:hover {
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
        }
      `}</style>
    </div>
  );
}
