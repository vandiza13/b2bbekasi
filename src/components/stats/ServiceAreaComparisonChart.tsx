'use client';

import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart/register';
import { KpiMetric } from '@/types/kpi';
import { REPORT_SALES_AREAS } from '@/lib/kpi/report-matrix';

interface ServiceAreaComparisonChartProps {
  metrics: KpiMetric[];
}

export const ServiceAreaComparisonChart: React.FC<ServiceAreaComparisonChartProps> = ({ metrics }) => {
  const [selectedMetricId, setSelectedMetricId] = useState<string>('TTR_HSI_HVC_4H');

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId) || metrics[0];

  const labels = REPORT_SALES_AREAS.map((sa) => sa.label);

  const saRates = REPORT_SALES_AREAS.map((sa) => {
    if (!selectedMetric || !selectedMetric.stoBreakdown) return 0;
    const items = selectedMetric.stoBreakdown.filter((b) =>
      sa.stos.map((s) => s.toUpperCase()).includes(b.sto.toUpperCase())
    );
    const total = items.reduce((acc, i) => acc + i.total, 0);
    const comply = items.reduce((acc, i) => acc + i.comply, 0);
    return total > 0 ? Number(((comply / total) * 100).toFixed(2)) : 100;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: `${selectedMetric?.id || ''} (%)`,
        data: saRates,
        backgroundColor: saRates.map((r) =>
          r >= (selectedMetric?.targetRate || 0) ? '#2563eb' : '#f43f5e'
        ),
        borderRadius: 8,
        maxBarThickness: 36,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: { raw: unknown }) => `Realisasi: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sebaran Wilayah
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Kinerja 8 Sales Area</h3>
        </div>

        {/* Metric Selector Dropdown */}
        <select
          value={selectedMetricId}
          onChange={(e) => setSelectedMetricId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id} className="bg-white text-slate-800">
              {m.id} (Target: {m.targetRate}%)
            </option>
          ))}
        </select>
      </div>

      <div className="h-72 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
