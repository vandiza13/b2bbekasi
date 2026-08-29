'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Ringkasan KPI & Kartu Monitoring',
  },
  {
    name: 'Statistik',
    href: '/statistik',
    icon: BarChart3,
    description: 'Grafik Analitik & Tren Kinerja',
  },
  {
    name: 'Report',
    href: '/report',
    icon: FileSpreadsheet,
    description: 'Template Matrix Spreadsheet & Telegram',
  },
  {
    name: 'Upload Data',
    href: '/upload',
    icon: UploadCloud,
    description: 'Ingesti File Excel Insera & SQM',
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
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

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container (Clean Light Theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-300 ease-in-out shadow-sm ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } lg:translate-x-0 ${
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        }`}
      >
        {/* Header / Brand Area */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
            onClick={onMobileClose}
          >
            <BrandLogo showText={!isCollapsed} size={isCollapsed ? 'sm' : 'md'} theme="light" />
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className={`px-2 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase transition-opacity ${isCollapsed ? 'lg:hidden' : 'block'}`}>
            Menu Utama
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.name : undefined}
                className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
              >
                <div className={`flex items-center justify-center shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                  <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col truncate">
                    <span className="truncate leading-tight font-bold">{item.name}</span>
                    <span className={`text-[10px] truncate mt-0.5 font-normal ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                      {item.description}
                    </span>
                  </div>
                )}

                {/* Collapsed Tooltip for desktop */}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-slate-800 whitespace-nowrap lg:group-hover:block z-50">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Area with Collapse Toggle & Logout */}
        <div className="border-t border-slate-100 p-3 space-y-2">
          {/* Status Badge (when expanded) */}
          {!isCollapsed && (
            <div className="hidden lg:flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700 font-semibold">Branch Bekasi</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                PROD
              </span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span>Ciutkan Sidebar</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer disabled:opacity-50 ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            title="Keluar dari Aplikasi"
          >
            <LogOut className={`w-4 h-4 shrink-0 ${isLoggingOut ? 'animate-pulse' : ''}`} />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
