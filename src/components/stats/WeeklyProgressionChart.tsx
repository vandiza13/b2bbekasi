'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import '@/lib/chart/register';
import { KpiMetric } from '@/types/kpi';

interface WeeklyProgressionChartProps {
  metrics: KpiMetric[];
}

export const WeeklyProgressionChart: React.FC<WeeklyProgressionChartProps> = ({ metrics }) => {
  const weeks = ['W1', 'W2', 'W3', 'W4'];

  const hsi4 = metrics.find((m) => m.id === 'TTR_HSI_HVC_4H');
  const hsi24 = metrics.find((m) => m.id === 'TTR_HSI_HVC_24H');
  const asrHsi = metrics.find((m) => m.id === 'ASR_GUARANTEE_HSI');
  const asrDatin = metrics.find((m) => m.id === 'ASR_GUARANTEE_DATIN');

  const getWeekRates = (m?: KpiMetric) => {
    if (!m) return [100, 100, 100, 100];
    return weeks.map((w) => {
      const found = m.weekly.find((item) => item.week === w);
      return found ? found.realRate : 100;
    });
  };

  const chartData = {
    labels: weeks,
    datasets: [
      {
        label: 'TTR HSI 4 Jam',
        data: getWeekRates(hsi4),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'TTR HSI 24 Jam',
        data: getWeekRates(hsi24),
        borderColor: '#6366f1',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Assurance HSI',
        data: getWeekRates(asrHsi),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Assurance DATIN',
        data: getWeekRates(asrDatin),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#475569',
          font: { size: 10, weight: 'bold' as const },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) => `${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 60,
        max: 100,
        ticks: {
          color: '#94a3b8',
          callback: (val: string | number) => `${val}%`,
          font: { size: 10 },
        },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: {
          color: '#334155',
          font: { size: 11, weight: 'bold' as const },
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tren Mingguan
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Progression W1 – W4</h3>
        </div>
        <span className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">Bulan Berjalan</span>
      </div>

      <div className="h-72 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
