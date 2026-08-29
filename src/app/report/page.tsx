'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BranchBekasiTable } from '@/components/report/BranchBekasiTable';
import { TelegramPreviewModal } from '@/components/report/TelegramPreviewModal';
import { ReportMatrixResult } from '@/lib/kpi/report-matrix';
import { FileSpreadsheet, Send, RefreshCw, AlertCircle } from 'lucide-react';

export default function ReportPage() {
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<ReportMatrixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const fetchMatrix = useCallback(async (targetPeriod: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kpi/report-matrix?period=${encodeURIComponent(targetPeriod)}`);
      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrixData(data.matrix);
      } else {
        setError(data.error || 'Gagal memuat tabel matrix report');
      }
    } catch {
      setError('Koneksi ke server terputus.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix(period);
  }, [period, fetchMatrix]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchMatrix(period);
  };

  return (
    <AppLayout
      period={period}
      onPeriodChange={handlePeriodChange}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onOpenTelegram={() => setIsTelegramModalOpen(true)}
    >
      <div className="space-y-6">
        
        {/* Page Banner */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Format Template Resmi Google Spreadsheet</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Report Dashboard Branch Bekasi
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                Tampilan matriks kinerja per Service Area (8 SA) dan agregat Branch Bekasi dengan indikator DATIN, HSI, MTTR, WIFI, SQM, serta kalkulasi Total Score &amp; Achievement.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-400 hover:to-blue-500 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke Telegram</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-card">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !matrixData && (
          <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Memuat matriks laporan Branch Bekasi...</p>
          </div>
        )}

        {/* Matrix Table */}
        {matrixData && <BranchBekasiTable data={matrixData} />}

      </div>

      {/* Telegram Broadcast Preview Modal */}
      <TelegramPreviewModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        period={period}
      />
    </AppLayout>
  );
}
