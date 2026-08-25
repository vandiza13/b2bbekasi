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
    <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      
      {/* TOP */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {metric.category}
            </div>
            <h3 className="text-sm font-extrabold leading-5 text-slate-900">
              {metric.name}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              isAchieved
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {isAchieved ? 'ACHIEVED' : 'BELOW TARGET'}
          </span>
        </div>
      </div>

      {/* PERFORMANCE */}
      <div className="px-5 py-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Real
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {metric.realRate.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Target
            </div>
            <div className="mt-1 text-2xl font-extrabold text-blue-600">
              {metric.targetRate.toFixed(2)}%
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total Tiket
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {metric.totalTickets}
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>Achievement</span>
            <span>{progressRatio.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                isAchieved ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, progressRatio))}%` }}
            />
          </div>
        </div>

        {/* WEEK */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {metric.weekly.map((w) => {
            const wAchieved = w.ticketCount === 0 || w.realRate >= metric.targetRate;
            return (
              <button
                key={w.week}
                type="button"
                onClick={() => onOpenDetail?.(metric, w.week, false)}
                className="group rounded-xl bg-slate-50 p-2.5 text-center transition hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 active:scale-95 cursor-pointer"
                title={`Lihat detail ${w.week}`}
              >
                <div className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500">
                  {w.week}
                </div>
                <div
                  className={`mt-1 text-xs font-extrabold ${
                    w.ticketCount === 0
                      ? 'text-slate-400'
                      : wAchieved
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {w.ticketCount > 0 ? `${w.realRate.toFixed(2)}%` : '-'}
                </div>
                <div className="mt-0.5 text-[9px] text-slate-400 group-hover:text-blue-500">
                  {w.ticketCount} tiket
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTION */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail?.(metric, undefined, false)}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            Lihat Monthly
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail?.(metric, undefined, true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Below Target
          </button>
        </div>

      </div>
    </div>
  );
};
