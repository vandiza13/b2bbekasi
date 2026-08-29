'use client';

import React from 'react';
import { KpiSummary } from '@/types/kpi';
import { Activity, CheckCircle2, XCircle, Target } from 'lucide-react';

interface SummaryCardsProps {
  summary: KpiSummary;
}

const CARD_STYLES = {
  total: { chip: 'bg-slate-100 text-slate-600', Icon: Activity },
  achieved: { chip: 'bg-emerald-50 text-emerald-600', Icon: CheckCircle2 },
  below: { chip: 'bg-red-50 text-red-500', Icon: XCircle },
  overall: { chip: 'bg-blue-100 text-blue-600', Icon: Target },
} as const;

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-card transition hover:border-slate-300 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Total Indicator
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
              {summary.totalIndicators}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Total KPI Aktif
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARD_STYLES.total.chip}`}>
            <CARD_STYLES.total.Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-emerald-200 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Achieved
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-emerald-600">
              {summary.achievedCount}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Tercapai (Comply)
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARD_STYLES.achieved.chip}`}>
            <CARD_STYLES.achieved.Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-red-200 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Below Target
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-red-500">
              {summary.belowTargetCount}
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Tidak Tercapai (Not Comply)
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARD_STYLES.below.chip}`}>
            <CARD_STYLES.below.Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-5 shadow-card transition hover:border-blue-300 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">
              Achievement
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight text-blue-700">
              {summary.overallAchievement.toFixed(2)}%
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-400">
              Skor Akumulatif
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARD_STYLES.overall.chip}`}>
            <CARD_STYLES.overall.Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </div>

    </section>
  );
};
