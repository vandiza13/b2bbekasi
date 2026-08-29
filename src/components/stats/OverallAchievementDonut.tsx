'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import '@/lib/chart/register';
import { KpiSummary } from '@/types/kpi';
import { Award, CheckCircle2, XCircle } from 'lucide-react';

interface OverallAchievementDonutProps {
  summary: KpiSummary;
}

export const OverallAchievementDonut: React.FC<OverallAchievementDonutProps> = ({ summary }) => {
  const chartData = {
    labels: ['Achieved', 'Below Target'],
    datasets: [
      {
        data: [summary.achievedCount, summary.belowTargetCount],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const badgeRank =
    summary.overallAchievement >= 90
      ? { label: 'PLATINUM', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : summary.overallAchievement >= 70
      ? { label: 'GOLD', color: 'bg-amber-50 text-amber-700 border-amber-200' }
      : { label: 'SILVER', color: 'bg-rose-50 text-rose-700 border-rose-200' };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Kinerja Agregat
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Overall Achievement</h3>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${badgeRank.color}`}>
          <Award className="w-3.5 h-3.5" />
          <span>{badgeRank.label}</span>
        </span>
      </div>

      <div className="relative my-4 flex h-48 items-center justify-center">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.overallAchievement}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {summary.achievedCount} / {summary.totalIndicators} Indikator
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 p-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[10px] font-bold text-emerald-700 uppercase">Achieved</div>
            <div className="text-lg font-black text-emerald-900">{summary.achievedCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-2.5">
          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[10px] font-bold text-rose-700 uppercase">Below Target</div>
            <div className="text-lg font-black text-rose-900">{summary.belowTargetCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
