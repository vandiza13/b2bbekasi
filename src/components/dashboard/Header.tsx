'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Upload, Calendar, RefreshCw, LogOut } from 'lucide-react';

interface HeaderProps {
  period: string;
  onPeriodChange: (newPeriod: string) => void;
  onOpenUpload: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const Header: React.FC<HeaderProps> = ({
  period,
  onPeriodChange,
  isLoading,
  onRefresh,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };
  const availablePeriods = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const baseDate = new Date();
    const currentYear = baseDate.getFullYear();
    const currentMonth = baseDate.getMonth();

    for (let i = 0; i < 12; i++) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      const monthStr = String(targetMonth + 1).padStart(2, '0');
      const key = `${targetYear}-${monthStr}`;
      const label = `${MONTH_NAMES[targetMonth]} ${targetYear}`;
      list.push({ key, label });
    }
    return list;
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-8">
        
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
            <span className="text-xs font-black text-white">KPI</span>
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">KPI Performance</div>
            <div className="text-[10px] text-slate-400">Branch Bekasi</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {availablePeriods.map((p) => (
                <option key={p.key} value={p.key} className="bg-slate-900 text-slate-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/20"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Data</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition disabled:opacity-50"
            title="Keluar"
          >
            <LogOut className={`h-3.5 w-3.5 ${isLoggingOut ? 'animate-pulse' : ''}`} />
          </button>

        </div>

      </div>
    </header>
  );
};
