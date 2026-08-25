'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Building, Ticket } from 'lucide-react';
import { QualityData } from './QualityCards';

interface QualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QualityData | null;
  selectedWeek?: string | null;
  title?: string;
}

export const QualityModal: React.FC<QualityModalProps> = ({
  isOpen,
  onClose,
  item,
  selectedWeek,
  title = 'Quality Performance',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const weekData = useMemo(() => {
    if (!item || !selectedWeek || !item.weeks) return null;
    return item.weeks[selectedWeek];
  }, [item, selectedWeek]);

  const targetNum = useMemo(() => {
    if (!item) return 0;
    const str = String(item.target || '').replace(',', '.');
    const match = str.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }, [item]);

  const realVal = useMemo(() => {
    if (!item) return 0;
    if (weekData) return Number(weekData.q ?? weekData.real ?? 0);
    return Number(item.real || 0);
  }, [item, weekData]);

  const totalTiket = useMemo(() => {
    if (!item) return 0;
    if (weekData) return Number(weekData.totalTiket ?? weekData.allTickets?.length ?? 0);
    return Number(item.totalTiket || 0);
  }, [item, weekData]);

  const listBilled = useMemo(() => {
    if (!item) return 0;
    if (weekData) return Number(weekData.listBilled || item.listBilled || 0);
    return Number(item.listBilled || 0);
  }, [item, weekData]);

  const isAchieved = targetNum > 0 ? realVal <= targetNum : true;

  const tickets = useMemo(() => {
    if (!weekData?.allTickets) return [];
    return weekData.allTickets.filter((t) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        t.tiket.toLowerCase().includes(q) ||
        t.sto.toLowerCase().includes(q) ||
        t.sa.toLowerCase().includes(q)
      );
    });
  }, [weekData, searchTerm]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                QUANTITY PERFORMANCE
              </span>
              {selectedWeek && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedWeek}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {title} {selectedWeek ? `• ${selectedWeek}` : '• Service Area'}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Week Date Banner if weekly */}
          {selectedWeek && weekData && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                Periode {selectedWeek}
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-800">
                {weekData.startDate || '-'} <span className="mx-1 text-slate-400">→</span> {weekData.endDate || '-'}
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real (Q)</span>
              <div className={`text-2xl font-black mt-0.5 ${isAchieved ? 'text-emerald-600' : 'text-rose-500'}`}>
                {realVal.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</span>
              <div className="text-2xl font-black text-blue-600 mt-0.5">
                {typeof item.target === 'number' ? `${item.target.toFixed(2)}%` : String(item.target)}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tiket</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {totalTiket}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">List Berbilled</span>
              <div className="text-2xl font-black text-indigo-600 mt-0.5">
                {listBilled}
              </div>
            </div>
          </div>

          {/* Branches / Service Area Table */}
          {item.branches && Object.keys(item.branches).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Service Area
                </h3>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[500px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Service Area</th>
                        <th className="px-4 py-3 text-center">Total Tiket</th>
                        <th className="px-4 py-3 text-center text-blue-600">List Berbilled</th>
                        <th className="px-4 py-3 text-right">Real (Q)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(item.branches).map(([sa, b]) => {
                        const bReal = Number(b.q || 0);
                        const bAchieved = targetNum > 0 ? bReal <= targetNum : true;
                        return (
                          <tr key={sa} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">{sa}</td>
                            <td className="px-4 py-3 text-center text-slate-700">{b.totalTiket || 0}</td>
                            <td className="px-4 py-3 text-center text-blue-600 font-semibold">{b.listBilled || 0}</td>
                            <td className={`px-4 py-3 text-right font-bold ${bAchieved ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {bReal.toFixed(2)}%
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

          {/* Ticket Detail Table for Weekly Drilldown */}
          {selectedWeek && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Detail Tiket ({tickets.length} Tiket)
                  </h3>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Tiket, STO..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center">#</th>
                        <th className="px-4 py-3">No Tiket</th>
                        <th className="px-4 py-3">STO</th>
                        <th className="px-4 py-3">Service Area</th>
                        <th className="px-4 py-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets.length > 0 ? (
                        tickets.map((t, idx) => (
                          <tr key={t.tiket + idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{t.tiket}</td>
                            <td className="px-4 py-3 font-semibold text-blue-600">{t.sto}</td>
                            <td className="px-4 py-3 text-slate-600">{t.sa}</td>
                            <td className="px-4 py-3 text-slate-600">{t.tanggal}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada tiket pada periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
