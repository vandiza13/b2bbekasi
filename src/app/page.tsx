'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DetailModal } from '@/components/dashboard/DetailModal';
import { QualityCards, QualityData } from '@/components/dashboard/QualityCards';
import { QualityModal } from '@/components/dashboard/QualityModal';
import { StatsResponse, KpiMetric } from '@/types/kpi';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>('2026-08');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Metric Modal drilldown state
  const [selectedMetric, setSelectedMetric] = useState<KpiMetric | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'W1' | 'W2' | 'W3' | 'W4' | null>(null);
  const [onlyBelowTarget, setOnlyBelowTarget] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Quality Modal drilldown state
  const [selectedQualityItem, setSelectedQualityItem] = useState<QualityData | null>(null);
  const [selectedQualityWeek, setSelectedQualityWeek] = useState<string | null>(null);
  const [selectedQualityTitle, setSelectedQualityTitle] = useState<string>('Quality Performance');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const d = new Date();
    const currentPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentPeriod);
  }, []);

  const fetchStats = useCallback(async (periodToFetch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kpi/stats?period=${periodToFetch}`);
      if (!res.ok) {
        throw new Error('Gagal memuat data statistik KPI');
      }
      const json: StatsResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('Fetch error:', err);
      setError((err as Error).message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period) {
      fetchStats(period);
    }
  }, [period, fetchStats]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleOpenDetail = (metric: KpiMetric, week?: 'W1' | 'W2' | 'W3' | 'W4', belowOnly: boolean = false) => {
    setSelectedMetric(metric);
    setSelectedWeek(week || null);
    setOnlyBelowTarget(belowOnly);
    setIsDetailOpen(true);
  };

  const handleOpenQualityModal = (item: QualityData, title: string) => {
    setSelectedQualityItem(item);
    setSelectedQualityWeek(null);
    setSelectedQualityTitle(title);
    setIsQualityModalOpen(true);
  };

  const handleOpenQualityWeeklyModal = (item: QualityData, weekKey: string) => {
    setSelectedQualityItem(item);
    setSelectedQualityWeek(weekKey);
    setSelectedQualityTitle(item.indicator || 'Quality Performance');
    setIsQualityModalOpen(true);
  };

  const ttrMetrics = useMemo(() => {
    if (!data?.metrics) return [];
    return data.metrics.filter((m) => !m.id.startsWith('ASR_'));
  }, [data]);

  const assuranceMetrics = useMemo(() => {
    if (!data?.metrics) return [];
    return data.metrics.filter((m) => m.id.startsWith('ASR_'));
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <Header
        period={period}
        onPeriodChange={handlePeriodChange}
        onOpenUpload={() => {}}
        isLoading={isLoading}
        onRefresh={() => fetchStats(period)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchStats(period)}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold text-red-800 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Dashboard Title & Floating Update Widget */}
        <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              Branch Bekasi Monitoring
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Performance Dashboard
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Monitoring TTR Performance, Assurance Guarantee, dan Quantity Performance berdasarkan Service Area.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Update Data
            </div>
            <div className="mt-1 text-sm font-bold text-slate-800">
              {data?.period || 'Loading...'}
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        {data && (
          <SummaryCards summary={data.summary} />
        )}

        {/* Loading Spinner */}
        {isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 my-8 shadow-card">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <div className="text-xs font-semibold text-slate-500">Memuat data KPI...</div>
          </div>
        )}

        {/* Section 1: TTR Performance */}
        {ttrMetrics.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  TTR Performance
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Compliance berdasarkan indikator TTR
                </p>
              </div>

              <div className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm">
                DATIN + HSI + WIFI 
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {ttrMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Assurance Guarantee */}
        {assuranceMetrics.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Assurance Guarantee
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Monitoring kualitas tiket berdasarkan status GAUL
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {assuranceMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Quantity Performance (Q-Index: Q HSI & Q DATIN) - PALING BAWAH */}
        {data && (data.qHsi || data.qDatin) && (
          <div className="mb-10">
            <QualityCards
              qHsi={data.qHsi}
              qDatin={data.qDatin}
              onOpenQualityModal={handleOpenQualityModal}
              onOpenQualityWeeklyModal={handleOpenQualityWeeklyModal}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          Dashboard Branch Bekasi <span className="mx-1">•</span> TTR, Assurance & Quality Performance Monitoring
        </footer>

      </main>

      {/* Metric Detail Drilldown Modal */}
      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        metric={selectedMetric}
        selectedWeek={selectedWeek}
        onlyBelowTarget={onlyBelowTarget}
      />

      {/* Quality Drilldown Modal */}
      <QualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        item={selectedQualityItem}
        selectedWeek={selectedQualityWeek}
        title={selectedQualityTitle}
      />
    </div>
  );
}
