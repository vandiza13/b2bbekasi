'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart/register';
import { KpiMetric, QualityData } from '@/types/kpi';

interface TargetVsRealBarChartProps {
  metrics: KpiMetric[];
  qHsi?: QualityData | null;
  qDatin?: QualityData | null;
}

export const TargetVsRealBarChart: React.FC<TargetVsRealBarChartProps> = ({
  metrics,
  qHsi,
  qDatin,
}) => {
  const labels: string[] = [];
  const realData: number[] = [];
  const targetData: number[] = [];
  const barColors: string[] = [];

  metrics.forEach((m) => {
    let shortName = m.id.replace('TTR_', '').replace('ASR_GUARANTEE_', 'ASR_');
    labels.push(shortName);
    realData.push(m.realRate);
    targetData.push(m.targetRate);
    barColors.push(m.realRate >= m.targetRate ? '#10b981' : '#f43f5e');
  });

  if (qHsi) {
    labels.push('Q_HSI');
    realData.push(qHsi.real);
    targetData.push(parseFloat(String(qHsi.target).replace('%', '')));
    barColors.push(qHsi.real <= parseFloat(String(qHsi.target).replace('%', '')) ? '#10b981' : '#f43f5e');
  }

  if (qDatin) {
    labels.push('Q_DATIN');
    realData.push(qDatin.real);
    targetData.push(parseFloat(String(qDatin.target).replace('%', '')));
    barColors.push(qDatin.real <= parseFloat(String(qDatin.target).replace('%', '')) ? '#10b981' : '#f43f5e');
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Real Rate (%)',
        data: realData,
        backgroundColor: barColors,
        borderRadius: 6,
        maxBarThickness: 24,
      },
      {
        label: 'Target SLA (%)',
        data: targetData,
        backgroundColor: '#cbd5e1',
        borderRadius: 6,
        maxBarThickness: 24,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#475569',
          font: { size: 11, weight: 'bold' as const },
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
      x: {
        beginAtZero: true,
        max: 105,
        ticks: {
          color: '#94a3b8',
          callback: (val: string | number) => `${val}%`,
          font: { size: 10 },
        },
        grid: { color: '#f1f5f9' },
      },
      y: {
        ticks: {
          color: '#334155',
          font: { size: 10, weight: 'bold' as const },
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
            Perbandingan Target
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Real Rate vs Target SLA</h3>
        </div>
        <span className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">11 Indikator</span>
      </div>

      <div className="h-80 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
