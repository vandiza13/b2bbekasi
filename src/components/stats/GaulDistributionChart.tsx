'use client';

import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart/register';
import { KpiMetric } from '@/types/kpi';
import { MASTER_STOS } from '@/lib/kpi/constants';

interface GaulDistributionChartProps {
  metrics: KpiMetric[];
}

export const GaulDistributionChart: React.FC<GaulDistributionChartProps> = ({ metrics }) => {
  const [selectedService, setSelectedService] = useState<'HSI' | 'DATIN' | 'WIFI'>('HSI');

  const metricId =
    selectedService === 'HSI'
      ? 'ASR_GUARANTEE_HSI'
      : selectedService === 'DATIN'
      ? 'ASR_GUARANTEE_DATIN'
      : 'ASR_GUARANTEE_WIFI';

  const asrMetric = metrics.find((m) => m.id === metricId);

  const labels = MASTER_STOS;

  const tidakGaulData = MASTER_STOS.map((sto) => {
    if (!asrMetric || !asrMetric.stoBreakdown) return 0;
    const item = asrMetric.stoBreakdown.find((b) => b.sto.toUpperCase() === sto.toUpperCase());
    return item ? item.comply : 0;
  });

  const gaulData = MASTER_STOS.map((sto) => {
    if (!asrMetric || !asrMetric.stoBreakdown) return 0;
    const item = asrMetric.stoBreakdown.find((b) => b.sto.toUpperCase() === sto.toUpperCase());
    return item ? item.below : 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tidak Gaul (Comply)',
        data: tidakGaulData,
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'GAUL (Gangguan Berulang)',
        data: gaulData,
        backgroundColor: '#f43f5e',
        borderRadius: 4,
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
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#334155', font: { size: 10, weight: 'bold' as const } },
        grid: { display: false },
      },
      y: {
        stacked: true,
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: '#f1f5f9' },
      },
    },
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Assurance Guarantee
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Sebaran Tiket GAUL per STO</h3>
        </div>

        {/* Service Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
          {(['HSI', 'DATIN', 'WIFI'] as const).map((srv) => (
            <button
              key={srv}
              type="button"
              onClick={() => setSelectedService(srv)}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedService === srv
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {srv}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
