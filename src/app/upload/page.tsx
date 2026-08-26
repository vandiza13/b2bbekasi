'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface FileCategoryItem {
  id: string;
  category: string;
  icon: string;
  label: string;
}

interface LogItem {
  time: string;
  message: string;
  type: 'success' | 'process' | 'error' | 'info';
}

const FILE_CATEGORIES: FileCategoryItem[] = [
  { id: 'fileHSI', category: 'HSI', icon: '📡', label: 'HSI' },
  { id: 'fileDATIN', category: 'DATIN', icon: '🌐', label: 'DATIN' },
  { id: 'fileSIPTRUNK', category: 'SIP TRUNK', icon: '☎️', label: 'SIP TRUNK' },
  { id: 'fileDWDM', category: 'DWDM', icon: '🔦', label: 'DWDM' },
  { id: 'fileWIFI', category: 'WIFI', icon: '📶', label: 'WIFI' },
  { id: 'fileSQMHSI', category: 'SQM HSI', icon: '📈', label: 'SQM HSI' },
  { id: 'fileSQMDATIN', category: 'SQM DATIN', icon: '📊', label: 'SQM DATIN' },
  { id: 'fileQHSI', category: 'Q HSI', icon: '📝', label: 'Q HSI' },
  { id: 'fileQDATIN', category: 'Q DATIN', icon: '📝', label: 'Q DATIN' },
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
      alert('⚠️ Pilih minimal satu file Excel');
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
      setProgressText(`🔄 ${file.name}\n📁 Kategori : ${cat}\n📊 ${current}/${total}\n📦 Antrian : ${queueLength} file`);
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
        addLog(`✅ Berhasil memproses ${data.processedRows} baris untuk ${cat} (${data.period}) dalam ${data.executionTimeMs}ms`, 'success');
      } catch (err) {
        addLog(`❌ Gagal memproses ${cat}: ${(err as Error).message}`, 'error');
      }
    }

    setProgressPercent(100);
    setProgressText('✅ Semua proses selesai');
    addLog(`🎉 Seluruh antrian selesai diproses: ${successCount} berhasil dari ${total} file.`, 'success');
    setIsProcessing(false);
  };

  return (
    <div className="bg-gradient-to-br from-blue-100 via-gray-100 to-blue-200 min-h-screen flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl p-8">
        
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1.5 transition"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-700">
          📊 Upload File Excel
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8 text-sm">
          Pilih file sesuai kategori. Sistem akan memproses otomatis sesuai antrian.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FILE_CATEGORIES.map((item) => {
            const hasFile = Boolean(selectedFiles[item.category]);
            return (
              <div key={item.id} className="upload-card">
                <label>
                  <div className="title flex items-center justify-between">
                    <span>{item.icon} {item.label}</span>
                    {hasFile && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ Terpilih
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
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isProcessing ? '⏳ Sedang Memproses Antrian...' : '🚀 Upload & Proses Semua'}
        </button>

        {showProgress && (
          <div id="progressContainer" className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-700">⚙️ Progress</span>
              <span id="progressPercent" className="text-blue-600 text-sm font-bold">
                {progressPercent}%
              </span>
            </div>

            <p id="progressText" className="text-sm text-gray-600 mb-3 whitespace-pre-line font-medium">
              {progressText}
            </p>

            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                id="progressBar"
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div id="logSection" className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">🧾 Log Proses</h3>
            <button
              type="button"
              onClick={clearLogs}
              className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
            >
              Hapus
            </button>
          </div>

          <div
            id="logArea"
            ref={logAreaRef}
            className="bg-gray-900 text-gray-200 rounded-xl p-4 h-72 overflow-y-auto font-mono text-xs space-y-1"
          >
            {logs.map((log, idx) => {
              let color = 'text-gray-200';
              if (log.type === 'success') color = 'text-green-400';
              if (log.type === 'process') color = 'text-yellow-400';
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
          gap: 12px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          padding: 18px;
          border-radius: 20px;
          cursor: pointer;
          transition: 0.25s;
        }

        .upload-card label:hover {
          background: #eff6ff;
          border-color: #2563eb;
          transform: translateY(-2px);
        }

        .title {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
        }

        .upload-card input {
          font-size: 13px;
          color: #6b7280;
        }

        .upload-card input::file-selector-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 7px 14px;
          border-radius: 10px;
          cursor: pointer;
          margin-right: 10px;
          transition: background 0.2s;
        }

        .upload-card input::file-selector-button:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
