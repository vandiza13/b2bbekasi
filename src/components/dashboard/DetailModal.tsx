'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Building, Ticket } from 'lucide-react';
import { KpiMetric, TicketItem, StoBreakdown } from '@/types/kpi';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: KpiMetric | null;
  selectedWeek?: 'W1' | 'W2' | 'W3' | 'W4' | null;
  onlyBelowTarget?: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  metric,
  selectedWeek,
  onlyBelowTarget = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelowOnly, setFilterBelowOnly] = useState(onlyBelowTarget);

  useEffect(() => {
    setFilterBelowOnly(onlyBelowTarget);
    setSearchTerm('');
  }, [isOpen, onlyBelowTarget, metric, selectedWeek]);

  const activeTickets: TicketItem[] = useMemo(() => {
    if (!metric) return [];
    if (selectedWeek) {
      const wData = metric.weekly.find((w) => w.week === selectedWeek);
      return wData?.tickets || [];
    }
    return metric.allTickets || [];
  }, [metric, selectedWeek]);

  const activeStoBreakdown: StoBreakdown[] = useMemo(() => {
    if (!metric) return [];
    if (selectedWeek) {
      const wData = metric.weekly.find((w) => w.week === selectedWeek);
      return wData?.stoBreakdown || [];
    }
    return metric.stoBreakdown || [];
  }, [metric, selectedWeek]);

  const activeRealRate = useMemo(() => {
    if (!metric) return 0;
    if (selectedWeek) {
      const wData = metric.weekly.find((w) => w.week === selectedWeek);
      return wData?.realRate ?? 0;
    }
    return metric.realRate;
  }, [metric, selectedWeek]);

  const activeTotal = activeTickets.length;
  const activeComply = activeTickets.filter((t) => t.isComply).length;
  const activeBelow = activeTotal - activeComply;

  const displayedTickets = useMemo(() => {
    return activeTickets.filter((t) => {
      if (filterBelowOnly && t.isComply) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        t.incidentId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.serviceAreaCode.toLowerCase().includes(q) ||
        (t.serviceType && t.serviceType.toLowerCase().includes(q)) ||
        (t.summary && t.summary.toLowerCase().includes(q))
      );
    });
  }, [activeTickets, filterBelowOnly, searchTerm]);

  if (!isOpen || !metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                {metric.category}
              </span>
              <span className="text-xs font-mono text-slate-400">{metric.id}</span>
              {selectedWeek && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedWeek}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {metric.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real Rate</span>
              <div className={`text-2xl font-black mt-0.5 ${activeRealRate >= metric.targetRate ? 'text-emerald-600' : 'text-rose-500'}`}>
                {activeRealRate.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target SLA</span>
              <div className="text-2xl font-black text-blue-600 mt-0.5">
                {metric.targetRate.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tiket</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {activeTotal}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Below Target</span>
              <div className={`text-2xl font-black mt-0.5 ${activeBelow > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {activeBelow}
              </div>
            </div>
          </div>

          {activeStoBreakdown.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Service Area
                </h3>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Service Area</th>
                        <th className="px-4 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-center text-emerald-600">Comply</th>
                        <th className="px-4 py-3 text-center text-rose-500">Below</th>
                        <th className="px-4 py-3 text-right">Real</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeStoBreakdown.map((sto) => {
                        const isStoAchieved = sto.realRate >= metric.targetRate;
                        return (
                          <tr key={sto.sto} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {sto.sto}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700">{sto.total}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{sto.comply}</td>
                            <td className="px-4 py-3 text-center text-rose-500 font-semibold">{sto.below}</td>
                            <td className="px-4 py-3 text-right font-bold">
                              <span className={isStoAchieved ? 'text-emerald-600' : 'text-rose-500'}>
                                {sto.realRate.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Ticket Detail ({displayedTickets.length} Ticket)
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterBelowOnly(!filterBelowOnly)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    filterBelowOnly
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filterBelowOnly ? 'Semua Tiket' : 'Hanya Below Target'}
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari ID, Customer, STO..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Tiket</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Service Area</th>
                      <th className="px-4 py-3">Workzone</th>
                      <th className="px-4 py-3">TTR / Tanggal</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedTickets.length > 0 ? (
                      displayedTickets.map((t, idx) => (
                        <tr key={t.incidentId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {t.incidentId}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div>{t.customerName}</div>
                            {t.summary && (
                              <div className="text-[10px] text-slate-400 line-clamp-1">{t.summary}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                              {t.serviceAreaCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {t.workzone || t.serviceAreaCode}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                            {t.ttrMinutes !== null && t.ttrMinutes !== undefined ? `${t.ttrMinutes} mnt` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                t.isComply
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {t.isComply ? 'COMPLY' : 'BELOW TARGET'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          Tidak ada data ticket.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
