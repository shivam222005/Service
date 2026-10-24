import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Category } from '../types.js';
import { ArrowRight, Sparkles, Filter } from 'lucide-react';

interface CategoriesPageProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  useEffect(() => {
    api.categories.getAll().then(setCategories).finally(() => setLoading(false));
  }, []);

  const sectors = [
    { id: 'ALL', label: 'All Domains' },
    { id: 'AGRI_RURAL', label: 'Agro & Farm Services' },
    { id: 'ELECTRONICS', label: 'Solar & Inverter Electronics' },
    { id: 'HOME', label: 'Home & Sanitation' },
    { id: 'COMMUNITY', label: 'Ceremonies & Events' },
  ];

  const filteredCategories = selectedSector === 'ALL'
    ? categories
    : categories.filter((c) => c.sector === selectedSector);

  const getSectorLabel = (sector?: string) => {
    switch (sector) {
      case 'AGRI_RURAL': return 'Agri & Rural';
      case 'ELECTRONICS': return 'Power & Electronics';
      case 'HOME': return 'Home & Urban';
      case 'COMMUNITY': return 'Ceremonial & Events';
      default: return 'Trade';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Marketplace Service Sectors & Domains
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Connecting verified specialists with Indian homes, farms, workshops, and businesses across urban metros, talukas, and rural districts.
        </p>

        {/* Sector Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {sectors.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSector(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
                selectedSector === s.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading taxonomy...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('browse', { category: cat.slug })}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono mb-1">
                      <span>{getSectorLabel(cat.sector)}</span>
                      <span>·</span>
                      <span>{cat.services_count || 0} active listings</span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">{cat.name}</h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-xs font-semibold text-blue-600 border-t border-slate-100 mt-2">
                <span>View Verified Providers</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

