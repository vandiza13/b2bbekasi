'use client';

import React from 'react';
import { KpiMetric } from '@/types/kpi';

interface MetricCardProps {
  metric: KpiMetric;
  onOpenDetail?: (metric: KpiMetric, week?: 'W1' | 'W2' | 'W3' | 'W4', onlyBelow?: boolean) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onOpenDetail }) => {
  const isAchieved = metric.status === 'ACHIEVED';
  const progressRatio = metric.targetRate > 0 ? Math.min(100, (metric.realRate / metric.targetRate) * 100) : 0;

  return (
    <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">

      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {metric.category}
            </div>
            <h3 className="text-sm font-bold leading-5 tracking-tight text-slate-900">
              {metric.name}
            </h3>
          </div>
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
              isAchieved
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                : 'bg-red-50 text-red-600 ring-red-500/10'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isAchieved ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {isAchieved ? 'ACHIEVED' : 'BELOW TARGET'}
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-4">
          <div className="col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Real
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className={`text-[26px] font-extrabold leading-none tracking-tight ${isAchieved ? 'text-slate-900' : 'text-slate-900'}`}>
                {metric.realRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Target
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-blue-600">
              {metric.targetRate.toFixed(2)}%
            </div>
          </div>

          {metric.id.includes('ASR_GUARANTEE_') ? (
            <>
              <div className="col-span-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Tidak Gaul
                </div>
                <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-emerald-600">
                  {metric.achievedTickets}
                </div>
              </div>
              <div className="col-span-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Gaul
                </div>
                <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-red-500">
                  {metric.belowTargetTickets}
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 sm:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Total Tiket
              </div>
              <div className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
                {metric.totalTickets}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>Achievement</span>
            <span>{progressRatio.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAchieved
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, progressRatio))}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {metric.weekly.map((w) => {
            const wAchieved = w.ticketCount === 0 || w.realRate >= metric.targetRate;
            return (
              <button
                key={w.week}
                type="button"
                onClick={() => onOpenDetail?.(metric, w.week, false)}
                className="group rounded-xl bg-slate-50/80 p-2.5 text-center ring-1 ring-inset ring-slate-100 transition hover:bg-blue-50 hover:ring-blue-200 active:scale-95 cursor-pointer"
                title={`Lihat detail ${w.week}`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500">
                  {w.week}
                </div>
                <div
                  className={`mt-1 text-xs font-extrabold tracking-tight ${
                    w.ticketCount === 0
                      ? 'text-slate-300'
                      : wAchieved
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {w.ticketCount > 0 ? `${w.realRate.toFixed(2)}%` : '-'}
                </div>
                <div className="mt-0.5 text-[9px] font-medium text-slate-400 group-hover:text-blue-500">
                  {w.ticketCount} tiket
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail?.(metric, undefined, false)}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 cursor-pointer"
          >
            Lihat Monthly
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail?.(metric, undefined, true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            Below Target
          </button>
        </div>

      </div>
    </div>
  );
};
