'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DetailModal } from '@/components/dashboard/DetailModal';
import { QualityCards, QualityData } from '@/components/dashboard/QualityCards';
import { QualityModal } from '@/components/dashboard/QualityModal';
import { TelegramPreviewModal } from '@/components/report/TelegramPreviewModal';
import { StatsResponse, KpiMetric } from '@/types/kpi';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>('2026-08');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedMetric, setSelectedMetric] = useState<KpiMetric | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'W1' | 'W2' | 'W3' | 'W4' | null>(null);
  const [onlyBelowTarget, setOnlyBelowTarget] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedQualityItem, setSelectedQualityItem] = useState<QualityData | null>(null);
  const [selectedQualityWeek, setSelectedQualityWeek] = useState<string | null>(null);
  const [selectedQualityTitle, setSelectedQualityTitle] = useState<string>('Quality Performance');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);

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

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sheets/sync', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Gagal melakukan sinkronisasi data dari Google Sheets.');
      }
      await fetchStats(period);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat sinkronisasi');
      setIsLoading(false);
    }
  };

  const ttrMetrics = useMemo(() => {
    if (!data) return [];
    return data.metrics.filter((m) => {
      // Exclude MTTR_SIPTRUNK and MTTR_DWDM to match GAS UI
      if (m.code === 'MTTR_SIPTRUNK' || m.code === 'MTTR_DWDM') return false;
      return m.id.startsWith('TTR_') || m.id.startsWith('MTTR_');
    });
  }, [data]);

  const assuranceMetrics = useMemo(() => {
    if (!data) return [];
    return data.metrics.filter((m) => m.id.startsWith('ASR_'));
  }, [data]);

  const qualityMetrics = useMemo(() => {
    if (!data) return [];
    return data.metrics.filter((m) => m.id.startsWith('Q_'));
  }, [data]);

  const sqmMetrics = useMemo(() => {
    if (!data) return [];
    return data.metrics.filter((m) => m.id.startsWith('SQM_'));
  }, [data]);

  return (
    <AppLayout
      period={period}
      onPeriodChange={handlePeriodChange}
      isLoading={isLoading}
      onRefresh={() => fetchStats(period)}
      onSync={handleSync}
      onOpenTelegram={() => setIsTelegramModalOpen(true)}
    >
      <div className="space-y-8">
        
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-card">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchStats(period)}
              className="cursor-pointer rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 transition hover:bg-red-200"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 shadow-card">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              </span>
              Branch Bekasi Monitoring
            </div>

            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Performance Dashboard
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Monitoring TTR, Assurance Guarantee, SQM, dan Quality Performance (Q-Index) Branch Bekasi.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Update Data
            </div>
            <div className="mt-0.5 text-sm font-extrabold tracking-tight text-slate-800">
              {data?.period || 'Loading...'}
            </div>
          </div>
        </section>

        {data && (
          <SummaryCards summary={data.summary} />
        )}

        {isLoading && !data && (
          <div className="my-10 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-20 shadow-card">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
            <div className="text-xs font-semibold text-slate-500">Memuat data KPI...</div>
          </div>
        )}

        {ttrMetrics.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  TTR Performance
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Pencapaian SLA TTR untuk setiap sub-indikator (DATIN, HSI, WIFI)
                </p>
              </div>

              <div className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 ring-1 ring-inset ring-slate-200 shadow-2xs">
                DATIN • HSI • WIFI • MTTR
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

        {assuranceMetrics.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  Assurance Guarantee
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Rasio tiket bebas Gangguan Ulang (GAUL) / Non-Garansi Valid
                </p>
              </div>

              <div className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 ring-1 ring-inset ring-slate-200 shadow-2xs">
                Non-Garansi Valid
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

        {sqmMetrics.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  SQM Close Performance
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Monitoring % Close SQM HSI dan SQM DATIN
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-200 shadow-2xs">
                Solver + Relasi Gamas
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {sqmMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          </section>
        )}

        {data && (data.qHsi || data.qDatin) && (
          <div>
            <QualityCards
              qHsi={data.qHsi}
              qDatin={data.qDatin}
              onOpenQualityModal={handleOpenQualityModal}
              onOpenQualityWeeklyModal={handleOpenQualityWeeklyModal}
            />
          </div>
        )}

        <footer className="border-t border-slate-200/80 py-6 text-center text-xs font-medium text-slate-400">
          Dashboard Branch Bekasi <span className="mx-1 text-slate-300">•</span> TTR, Assurance &amp; Quality Performance Monitoring
        </footer>

      </div>

      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        metric={selectedMetric}
        selectedWeek={selectedWeek}
        onlyBelowTarget={onlyBelowTarget}
      />

      <QualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        item={selectedQualityItem}
        selectedWeek={selectedQualityWeek}
        title={selectedQualityTitle}
      />

      <TelegramPreviewModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        period={period}
      />
    </AppLayout>
  );
}
