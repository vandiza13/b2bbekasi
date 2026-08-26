'use client';

import React from 'react';
import { KpiSummary } from '@/types/kpi';

interface SummaryCardsProps {
  summary: KpiSummary;
}

const CARD_STYLES = {
  total: { chip: 'bg-slate-100 text-slate-600', glyph: '≡' },
  achieved: { chip: 'bg-emerald-50 text-emerald-600', glyph: '✓' },
  below: { chip: 'bg-red-50 text-red-500', glyph: '!' },
  overall: { chip: 'bg-blue-50 text-blue-600', glyph: '%' },
} as const;

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Total Indicator
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
              {summary.totalIndicators}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Indicator yang dimonitor
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${CARD_STYLES.total.chip}`}>
            ≡
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Achieved
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-emerald-600">
              {summary.achievedCount}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Indicator mencapai target
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${CARD_STYLES.achieved.chip}`}>
            ✓
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Below Target
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-red-500">
              {summary.belowTargetCount}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Indicator belum mencapai target
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${CARD_STYLES.below.chip}`}>
            !
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white px-5 py-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">
              Achievement
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-blue-700">
              {summary.overallAchievement.toFixed(2)}%
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Persentase pencapaian
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-sm font-bold text-blue-600">
            %
          </div>
        </div>
      </div>

    </section>
  );
};
