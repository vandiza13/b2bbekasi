'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OverallAchievementDonut } from '@/components/stats/OverallAchievementDonut';
import { TargetVsRealBarChart } from '@/components/stats/TargetVsRealBarChart';
import { ServiceAreaComparisonChart } from '@/components/stats/ServiceAreaComparisonChart';
import { WeeklyProgressionChart } from '@/components/stats/WeeklyProgressionChart';
import { GaulDistributionChart } from '@/components/stats/GaulDistributionChart';
import { StatsResponse } from '@/types/kpi';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

export default function StatistikPage() {
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (targetPeriod: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kpi/stats?period=${encodeURIComponent(targetPeriod)}`);
      const data = await res.json();
      if (data.period && data.metrics) {
        setStatsData(data);
      } else {
        setError(data.error || 'Gagal memuat statistik KPI');
      }
    } catch {
      setError('Koneksi ke server terputus.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchStats(period);
  };

  return (
    <AppLayout
      period={period}
      onPeriodChange={handlePeriodChange}
      isLoading={isLoading}
      onRefresh={handleRefresh}
    >
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik &amp; Visualisasi Analitik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Dashboard Statistik Kinerja KPI &amp; Tiket
            </h1>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-500">
              Analisis visual menyeluruh meliputi perbandingan realisasi terhadap target SLA, sebaran 8 Service Area, tren perkembangan mingguan, dan proporsi tiket gangguan berulang.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-card">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && !statsData && (
          <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Menyusun visualisasi statistik...</p>
          </div>
        )}

        {/* Charts Grid */}
        {statsData && (
          <div className="space-y-6">
            
            {/* Top Row: Overall Donut + Target vs Real Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <OverallAchievementDonut summary={statsData.summary} />
              </div>
              <div className="lg:col-span-2">
                <TargetVsRealBarChart
                  metrics={statsData.metrics}
                  qHsi={statsData.qHsi}
                  qDatin={statsData.qDatin}
                />
              </div>
            </div>

            {/* Middle Row: Service Area Comparison + Weekly Progression */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ServiceAreaComparisonChart metrics={statsData.metrics} />
              <WeeklyProgressionChart metrics={statsData.metrics} />
            </div>

            {/* Bottom Row: GAUL Distribution per STO */}
            <div>
              <GaulDistributionChart metrics={statsData.metrics} />
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}
