'use client';

import React from 'react';
import { ReportMatrixResult, MatrixCell } from '@/lib/kpi/report-matrix';

interface BranchBekasiTableProps {
  data: ReportMatrixResult;
}

function formatVal(val: number | null): string {
  if (val === null || val === undefined) return '-';
  return val.toFixed(2).replace('.', ',');
}

export const BranchBekasiTable: React.FC<BranchBekasiTableProps> = ({ data }) => {
  const getCellClass = (cell: MatrixCell) => {
    if (cell.real === null) {
      return 'text-slate-400 bg-white text-center';
    }
    if (!cell.isAchieved) {
      return 'bg-[#f8d7da] text-[#721c24] font-bold text-center ring-1 ring-rose-200 inset-0';
    }
    return 'bg-white text-slate-800 text-center font-medium';
  };

  const getAchievementBadge = (ach: 'PLATINUM' | 'GOLD' | 'SILVER') => {
    switch (ach) {
      case 'PLATINUM':
        return 'bg-emerald-600 text-white shadow-xs';
      case 'GOLD':
        return 'bg-amber-400 text-slate-900 shadow-xs';
      case 'SILVER':
      default:
        return 'bg-rose-600 text-white shadow-xs';
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Official Spreadsheet Matrix
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
            Dashboard Branch Bekasi
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700">
          <span className="text-slate-400">Update month :</span>
          <span className="text-blue-700 font-mono">{data.period}</span>
        </div>
      </div>

      {/* Spreadsheet Replica Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            {/* Primary Header */}
            <thead>
              <tr className="bg-[#104882] text-white divide-x divide-white/20">
                <th
                  rowSpan={2}
                  className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider min-w-[280px] align-middle"
                >
                  Indikator KPI
                </th>
                <th
                  rowSpan={2}
                  className="px-3 py-3.5 font-extrabold text-xs text-center uppercase tracking-wider w-24 align-middle bg-[#0d3b6c]"
                >
                  Target Complience
                </th>
                {data.salesAreas.map((sa) => (
                  <th
                    key={sa.key}
                    className="px-3 py-2 text-center font-extrabold text-xs tracking-wide bg-[#1d5c9f]"
                  >
                    {sa.label}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="px-3 py-3.5 text-center font-extrabold text-xs tracking-wider w-32 align-middle bg-[#071d37] text-amber-300 ring-2 ring-amber-400/30"
                >
                  Real (%) Branch Bekasi
                </th>
              </tr>
              <tr className="bg-[#144b82] text-white/90 text-[10px] uppercase font-bold divide-x divide-white/20">
                {data.salesAreas.map((sa) => (
                  <th key={`${sa.key}_sub`} className="px-2 py-1 text-center font-semibold bg-[#1a4f85]">
                    Real (%)
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body by Section */}
            <tbody className="divide-y divide-slate-200">
              {data.sections.map((sec) => (
                <React.Fragment key={sec.title}>
                  {/* Category Header Row */}
                  <tr className="bg-[#595959] text-white font-extrabold text-xs tracking-wider">
                    <td colSpan={data.salesAreas.length + 3} className="px-4 py-1.5 uppercase">
                      {sec.title}
                    </td>
                  </tr>

                  {/* Category Data Rows */}
                  {sec.rows.map((row) => (
                    <tr
                      key={row.name}
                      className="hover:bg-blue-50/40 transition-colors divide-x divide-slate-200"
                    >
                      {/* Indicator Name */}
                      <td className="px-4 py-2 text-slate-800 font-semibold text-xs leading-snug">
                        {row.name}
                      </td>

                      {/* Target Value */}
                      <td className="px-3 py-2 text-center text-slate-700 font-mono font-bold bg-slate-100/70">
                        {row.target.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Sales Areas Cells */}
                      {data.salesAreas.map((sa) => {
                        const cell = row.salesAreas[sa.key];
                        return (
                          <td
                            key={`${row.name}_${sa.key}`}
                            className={`px-2.5 py-2 font-mono text-xs ${getCellClass(cell)}`}
                          >
                            {formatVal(cell.real)}
                          </td>
                        );
                      })}

                      {/* Branch Bekasi Cell */}
                      <td
                        className={`px-3 py-2 font-mono text-xs font-bold ${
                          !row.branchBekasi.isAchieved && row.branchBekasi.real !== null
                            ? 'bg-[#f8d7da] text-[#721c24] ring-1 ring-rose-200 font-black'
                            : 'bg-slate-50 text-slate-950'
                        } text-center`}
                      >
                        {formatVal(row.branchBekasi.real)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Total Score Footer Row */}
              <tr className="bg-[#404040] text-white font-extrabold divide-x divide-white/20">
                <td colSpan={2} className="px-4 py-2.5 text-xs uppercase tracking-wider text-right pr-6">
                  Total Score
                </td>
                {data.salesAreas.map((sa) => (
                  <td key={`score_${sa.key}`} className="px-2 py-2.5 text-center font-mono text-sm font-black text-amber-300">
                    {data.totalScores[sa.key]}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center font-mono text-base font-black text-amber-300 bg-[#262626]">
                  {data.totalScores['branch']}
                </td>
              </tr>

              {/* Achievement Footer Row */}
              <tr className="bg-[#333333] text-white font-extrabold divide-x divide-white/20">
                <td colSpan={2} className="px-4 py-3 text-xs uppercase tracking-wider text-right pr-6">
                  Achievement
                </td>
                {data.salesAreas.map((sa) => {
                  const ach = data.achievements[sa.key];
                  return (
                    <td key={`ach_${sa.key}`} className="px-1 py-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-black tracking-wider ${getAchievementBadge(ach)}`}>
                        {ach}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center bg-[#1f1f1f]">
                  <span className={`inline-block px-3 py-1 rounded text-xs font-black tracking-wider ${getAchievementBadge(data.achievements['branch'])}`}>
                    {data.achievements['branch']}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Summary Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-xl text-xs shadow-2xs">
          <div className="w-4 h-4 rounded bg-[#f8d7da] border border-rose-300 shrink-0" />
          <span className="text-slate-600">
            <strong className="text-rose-700">Merah Muda</strong> = Realisasi di bawah target SLA (Below Target)
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-xl text-xs shadow-2xs">
          <div className="w-4 h-4 rounded bg-amber-400 shrink-0" />
          <span className="text-slate-600">
            <strong className="text-amber-600">GOLD</strong> = Total Score 12 – 15 indikator terpenuhi
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-xl text-xs shadow-2xs">
          <div className="w-4 h-4 rounded bg-emerald-600 shrink-0" />
          <span className="text-slate-600">
            <strong className="text-emerald-700">PLATINUM</strong> = Total Score ≥ 16 indikator terpenuhi
          </span>
        </div>
      </div>
    </div>
  );
};
