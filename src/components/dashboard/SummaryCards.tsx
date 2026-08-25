'use client';

import React from 'react';
import { KpiSummary } from '@/types/kpi';

interface SummaryCardsProps {
  summary: KpiSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      
      {/* 1. TOTAL INDICATOR */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL INDICATOR
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {summary.totalIndicators}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Indicator yang dimonitor
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg font-bold">
            ≡
          </div>
        </div>
      </div>

      {/* 2. ACHIEVED */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACHIEVED
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">
              {summary.achievedCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Indicator mencapai target
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-lg font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* 3. BELOW TARGET */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BELOW TARGET
            </div>
            <div className="mt-2 text-3xl font-extrabold text-red-600">
              {summary.belowTargetCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Indicator belum mencapai target
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 text-lg font-bold">
            !
          </div>
        </div>
      </div>

      {/* 4. ACHIEVEMENT */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACHIEVEMENT
            </div>
            <div className="mt-2 text-3xl font-extrabold text-blue-600">
              {summary.overallAchievement.toFixed(2)}%
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Persentase pencapaian
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
            %
          </div>
        </div>
      </div>

    </section>
  );
};
