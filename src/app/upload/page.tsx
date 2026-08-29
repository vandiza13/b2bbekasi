'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, CheckCircle2, RefreshCw, UploadCloud, Trash2, FileSpreadsheet } from 'lucide-react';

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

  const handleFileChange = (category: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      alert('Format file tidak didukung. Harap pilih .xlsx, .xls, atau .csv');
      event.target.value = '';
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [category]: file }));
    addLog(`File untuk ${category} dipilih: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
  };

  const clearLogs = () => {
    setLogs([]);
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
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Banner */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 shadow-card">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                </span>
                Data Ingestion
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Data Integration
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                Pilih file Excel mentah (Insera, SQM, MTTR, atau Q-Index) untuk ditarik ke dalam database. Sistem akan memvalidasi secara otomatis dan langsung memperbarui Dashboard.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shrink-0 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
          </div>
        </div>

        {/* Upload Container */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card space-y-6">
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FILE_CATEGORIES.map((item) => {
              const hasFile = Boolean(selectedFiles[item.category]);
              return (
                <div key={item.id} className="relative group">
                  <label className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4.5 cursor-pointer transition-all hover:bg-blue-50/50 hover:border-blue-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">{item.label}</span>
                      </div>
                      {hasFile && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
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
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
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
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Sedang Memproses Antrian...' : 'Upload & Proses Semua'}
          </button>

          {showProgress && (
            <div id="progressContainer" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Progress</span>
                <span id="progressPercent" className="font-mono font-bold text-blue-600 text-sm">
                  {progressPercent}%
                </span>
              </div>

              <p id="progressText" className="whitespace-pre-line text-xs font-mono text-slate-700">
                {progressText}
              </p>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  id="progressBar"
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {syncJobs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mirror Spreadsheet
                </h3>
                {syncPolling && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    menyinkronkan...
                  </span>
                )}
              </div>

              <ul className="divide-y divide-slate-200 text-xs">
                {syncJobs.map((j) => {
                  const pct = j.rowsTotal ? Math.round(((j.rowsDone || 0) / j.rowsTotal) * 100) : 0;
                  return (
                    <li key={j.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-bold text-slate-800">{j.category}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="text-slate-600">{j.targetSheet}</span>
                        {j.rowsTotal && (
                          <span className="ml-2 font-mono text-slate-500">({pct}% · {j.rowsDone}/{j.rowsTotal})</span>
                        )}
                      </div>
                      {j.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => retrySync(j.category)}
                          className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 text-xs font-bold transition hover:bg-rose-100"
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

          <div id="logSection" className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Log Proses Ingesti</h3>
              <button
                type="button"
                onClick={clearLogs}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Log</span>
              </button>
            </div>

            <div
              id="logArea"
              ref={logAreaRef}
              className="h-64 space-y-1 overflow-y-auto rounded-2xl border border-slate-900 bg-slate-950 p-4 font-mono text-xs text-slate-300 shadow-inner"
            >
              {logs.map((log, idx) => {
                let color = 'text-slate-300';
                if (log.type === 'success') color = 'text-emerald-400';
                if (log.type === 'process') color = 'text-amber-300';
                if (log.type === 'error') color = 'text-rose-400';

                return (
                  <div key={idx} className={`${color} py-0.5 leading-relaxed`}>
                    [{log.time}] {log.message}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
