'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Calendar,
  RefreshCw,
  Upload,
  Send,
  BarChart3,
  LayoutDashboard,
  FileSpreadsheet,
} from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  period?: string;
  onPeriodChange?: (newPeriod: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenTelegram?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  period,
  onPeriodChange,
  isLoading = false,
  onRefresh,
  onOpenTelegram,
}) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('b2b_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('b2b_sidebar_collapsed', String(next));
    } catch {
      // ignore
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

  const pageTitle = useMemo(() => {
    if (pathname === '/statistik') return { title: 'Statistik & Analitik KPI', icon: BarChart3 };
    if (pathname === '/report') return { title: 'Report Branch Bekasi', icon: FileSpreadsheet };
    if (pathname === '/upload') return { title: 'Upload Data Excel', icon: Upload };
    return { title: 'Dashboard Performance', icon: LayoutDashboard };
  }, [pathname]);

  const TitleIcon = pageTitle.icon;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-800 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area with Dynamic Left Margin */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Top Header (Clean Light Theme) */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:px-8 shadow-xs">
          
          {/* Left: Mobile Hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <TitleIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  {pageTitle.title}
                </h1>
                <p className="hidden md:block text-[11px] text-slate-500 font-medium">
                  Branch Bekasi • BGES Assurance &amp; Quality
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions (Period, Refresh, Telegram, Upload) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Period Selector */}
            {period && onPeriodChange && (
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 transition hover:border-slate-300">
                <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                <select
                  value={period}
                  onChange={(e) => onPeriodChange(e.target.value)}
                  className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {availablePeriods.map((p) => (
                    <option key={p.key} value={p.key} className="bg-white text-slate-800">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            {/* Telegram Action */}
            {onOpenTelegram && (
              <button
                type="button"
                onClick={onOpenTelegram}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 hover:text-sky-900 cursor-pointer shadow-2xs"
                title="Kirim Laporan ke Telegram"
              >
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Kirim Telegram</span>
              </button>
            )}

            {/* Upload Button */}
            {pathname !== '/upload' && (
              <Link
                href="/upload"
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 hover:text-blue-900 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            )}

          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
