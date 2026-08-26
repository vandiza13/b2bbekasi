'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Upload, Calendar, RefreshCw, LogOut } from 'lucide-react';

interface HeaderProps {
  period: string;
  onPeriodChange: (newPeriod: string) => void;
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
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A101E]/90 text-white shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-8">

        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-950/40 ring-1 ring-white/20 transition group-hover:shadow-blue-900/60">
            <span className="text-[11px] font-extrabold tracking-wide text-white">KPI</span>
          </div>
          <div>
            <div className="text-sm font-bold leading-tight tracking-tight">KPI Performance</div>
            <div className="text-[10px] font-medium tracking-wide text-slate-400">Branch Bekasi</div>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">

          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 transition hover:border-white/15">
            <Calendar className="mr-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="cursor-pointer bg-transparent pr-1 text-xs font-semibold text-slate-200 focus:outline-none"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl border border-blue-400/25 bg-gradient-to-b from-blue-500/20 to-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-200 shadow-sm transition hover:border-blue-400/45 hover:from-blue-500/30 hover:to-blue-600/20 hover:text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Data</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
            title="Keluar"
          >
            <LogOut className={`h-3.5 w-3.5 ${isLoggingOut ? 'animate-pulse' : ''}`} />
          </button>

        </div>

      </div>
    </header>
  );
};
