'use client';

import React from 'react';
import { FilterCategory } from '@/types/kpi';
import { Radio, Wifi, Network, Globe } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  counts: {
    ALL: number;
    DATIN: number;
    HSI: number;
    WIFI: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
}) => {
  const tabs: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Semua Layanan', icon: <Radio className="w-4 h-4" /> },
    { id: 'DATIN', label: 'DATIN', icon: <Network className="w-4 h-4" /> },
    { id: 'HSI', label: 'HSI (Internet)', icon: <Globe className="w-4 h-4" /> },
    { id: 'WIFI', label: 'WIFI', icon: <Wifi className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = selectedCategory === tab.id;
        const count = counts[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectCategory(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 border ${
              isActive
                ? 'bg-red-600/15 text-red-400 border-red-500/40 shadow-sm shadow-red-950'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                isActive
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
