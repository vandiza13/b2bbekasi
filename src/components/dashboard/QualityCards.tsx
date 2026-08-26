'use client';

import React from 'react';
import { KpiMetric } from '@/types/kpi';

export interface QualityData {
  indicator: string;
  source?: string;
  real: number;
  target: string | number;
  totalTiket: number;
  listBilled: number;
  weeks?: Record<string, {
    q: number;
    real: number;
    totalTiket: number;
    listBilled: number;
    startDate?: string;
    endDate?: string;
    allTickets?: Array<{
      tiket: string;
      sto: string;
      sa: string;
      tanggal: string;
    }>;
  }>;
  branches?: Record<string, {
    totalTiket: number;
    listBilled: number;
    q: number;
  }>;
}

interface QualityCardsProps {
  qHsi?: QualityData | null;
  qDatin?: QualityData | null;
  onOpenQualityModal?: (item: QualityData, title: string) => void;
  onOpenQualityWeeklyModal?: (item: QualityData, weekKey: string) => void;
}

export const QualityCards: React.FC<QualityCardsProps> = ({
  qHsi,
  qDatin,
  onOpenQualityModal,
  onOpenQualityWeeklyModal,
}) => {
  if (!qHsi && !qDatin) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Quality Performance
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Monitoring Q HSI dan Q DATIN
          </p>
        </div>

        <div className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400 ring-1 ring-inset ring-indigo-100">
          Q HSI · Q DATIN
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {qHsi && renderCard('Q HSI', qHsi, onOpenQualityModal, onOpenQualityWeeklyModal)}
        {qDatin && renderCard('Q DATIN', qDatin, onOpenQualityModal, onOpenQualityWeeklyModal)}
      </div>
    </section>
  );
};

function parseTargetNumber(target: string | number): number {
  if (typeof target === 'number') return target;
  const str = String(target || '').replace(',', '.');
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function renderCard(
  title: string,
  item: QualityData,
  onOpenModal?: (item: QualityData, title: string) => void,
  onOpenWeeklyModal?: (item: QualityData, weekKey: string) => void
) {
  const real = Number(item.real || 0);
  const total = Number(item.totalTiket || 0);
  const targetNum = parseTargetNumber(item.target);

  const achieved = targetNum > 0 ? real <= targetNum : true;

  const status = achieved
    ? {
        label: 'ACHIEVED',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
        dot: 'bg-emerald-500',
        bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
        color: 'text-emerald-600',
      }
    : {
        label: 'BELOW TARGET',
        badge: 'bg-red-50 text-red-600 ring-red-500/10',
        dot: 'bg-red-500',
        bar: 'bg-gradient-to-r from-red-400 to-red-500',
        color: 'text-red-500',
      };

  let progress = 0;
  if (targetNum > 0) {
    if (real <= targetNum) {
      progress = 100;
    } else {
      progress = Math.max(0, Math.min(100, (targetNum / real) * 100));
    }
  }

  const weekNames = ['W1', 'W2', 'W3', 'W4'];

  return (
    <div
      key={title}
      className="dashboard-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Quality Performance
            </div>
            <h3 className="text-sm font-bold leading-5 tracking-tight text-slate-900">
              {title}
            </h3>
          </div>

          <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${status.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Real
            </div>
            <div className={`mt-1.5 text-[26px] font-extrabold leading-none tracking-tight ${status.color}`}>
              {real.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Target
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-blue-600">
              {typeof item.target === 'number' ? `${item.target.toFixed(2)}%` : String(item.target)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Total Tiket
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
              {total}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>Achievement</span>
            <span>{progress.toFixed(0)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
              style={{ width: `${Math.max(2, progress)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            Weekly
          </div>

          <div className="grid grid-cols-4 gap-2">
            {weekNames.map((weekName) => {
              const weekData = item.weeks?.[weekName] || { q: 0, real: 0, totalTiket: 0, listBilled: 0 };
              const qVal = Number(weekData.q ?? weekData.real ?? 0);
              const wAchieved = targetNum > 0 ? qVal <= targetNum : true;
              const valueColor = wAchieved ? 'text-emerald-600' : 'text-red-500';
              const bgColor = wAchieved ? 'bg-emerald-50' : 'bg-red-50';

              return (
                <button
                  key={weekName}
                  type="button"
                  onClick={() => onOpenWeeklyModal?.(item, weekName)}
                  className={`group cursor-pointer rounded-xl border border-transparent ${bgColor} px-2 py-3 text-center transition hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 active:scale-95`}
                  title={`Lihat tiket ${weekName}`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-blue-600">
                    {weekName}
                  </div>
                  <div className={`mt-1 text-base font-extrabold tracking-tight ${valueColor}`}>
                    {qVal.toFixed(2)}%
                  </div>
                  <div className="mt-0.5 text-[9px] font-medium text-slate-400 group-hover:text-blue-600">
                    {weekData.totalTiket || 0} tiket
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => onOpenModal?.(item, title)}
            className="w-full cursor-pointer rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
          >
            Lihat Detail Tiket
          </button>
        </div>
      </div>
    </div>
  );
}
