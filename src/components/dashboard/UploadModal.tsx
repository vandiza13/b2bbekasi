'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UploadResponse } from '@/types/kpi';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (res: UploadResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    setUploadResult(null);
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Format berkas tidak valid. Harap pilih file Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Pilih file terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/kpi/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses berkas Insera.');
      }

      setUploadResult(data);
      onUploadSuccess(data);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Terjadi kesalahan saat mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setErrorMsg(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[6px]">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-overlay">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Data Insera</h3>
              <p className="text-xs text-slate-500">Excel / CSV Log Tiket Insiden</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {!uploadResult ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : file
                    ? 'border-emerald-500/60 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {file ? (
                  <>
                    <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • Klik untuk ganti file
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Tarik & letakkan berkas di sini, atau <span className="text-blue-600 underline font-semibold">Pilih Berkas</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Mendukung format .xlsx, .xls, atau .csv (In-memory buffer parsing)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Upload Success View */
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Upload Berhasil!</h4>
              <p className="text-xs text-slate-600">
                Berhasil memproses <strong>{uploadResult.processedRows} baris tiket</strong> untuk periode <strong>{uploadResult.period}</strong> dalam <strong>{uploadResult.executionTimeMs} ms</strong>.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Kolom yang didukung secara otomatis:</div>
            <p>Incident ID / Tiket ID, Summary, STO, Customer Name, Layanan, Kategori, Tgl Lapor, Tgl Selesai, TTR Menit, Status.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            {uploadResult ? 'Tutup' : 'Batal'}
          </button>

          {!uploadResult ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Mulai Proses</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors"
            >
              Upload Berkas Lain
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
