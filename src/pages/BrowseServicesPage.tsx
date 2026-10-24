import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ServiceListing, Category, ServiceMode } from '../types.js';
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle, 
  RotateCcw,
  Sparkles,
  BadgeCheck,
  Building2,
  Home
} from 'lucide-react';

interface BrowseServicesPageProps {
  initialFilters?: {
    search?: string;
    category?: string;
    city?: string;
    pincode?: string;
  };
  onNavigate: (tab: string, meta?: any) => void;
  onOpenBooking: (service: ServiceListing) => void;
}

export const BrowseServicesPage: React.FC<BrowseServicesPageProps> = ({
  initialFilters,
  onNavigate,
  onOpenBooking,
}) => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>(initialFilters?.search || '');
  const [category, setCategory] = useState<string>(initialFilters?.category || '');
  const [city, setCity] = useState<string>(initialFilters?.city || '');
  const [pincode, setPincode] = useState<string>(initialFilters?.pincode || '');
  const [serviceMode, setServiceMode] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sort, setSort] = useState<string>('rating');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [category, sort, serviceMode]);

  const loadCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await api.services.getAll({
        search: search.trim() || undefined,
        category: category || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        serviceMode: serviceMode || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort,
      });
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setPincode('');
    setServiceMode('');
    setMinPrice('');
    setMaxPrice('');
    setSort('rating');
    setTimeout(() => {
      api.services.getAll({ sort: 'rating' }).then(setServices);
    }, 0);
  };

  const getModeLabel = (mode: ServiceMode) => {
    switch (mode) {
      case 'ON_SITE':
        return 'On-Site (Home/Farm)';
      case 'AT_SHOP':
        return 'At Workshop';
      case 'REMOTE':
        return 'Remote Advisory';
      case 'TRAVEL':
        return 'Travel Service';
      default:
        return mode;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Browse Verified Services Across India
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search by 6-digit PIN code, district, or trade specialty. Connect directly with local mistris and technicians.
        </p>
      </div>

      {/* Main Filter & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Location & Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <form onSubmit={handleApplyFilter} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keywords</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Solar Pump, Inverter, Puja..."
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 6-Digit PIN Code */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Postal PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 413102, 411038, 226010"
                className="w-full font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* District / City */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">District or City</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune, Baramati, Lucknow"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Service Delivery Mode */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Delivery Mode</label>
              <select
                value={serviceMode}
                onChange={(e) => setServiceMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                <option value="">All Delivery Modes</option>
                <option value="ON_SITE">On-Site (At Client Home/Farm)</option>
                <option value="AT_SHOP">At Specialist Workshop</option>
                <option value="REMOTE">Remote / Video Guidance</option>
              </select>
            </div>

            {/* Price Range in INR */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none tabular-nums"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none tabular-nums"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Search Services
            </button>
          </form>
        </aside>

        {/* Listings Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting and Count Bar */}
          <div className="bg-white p-3.5 px-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700">
              Showing <span className="font-mono text-blue-600">{services.length}</span> verified services across India
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800 cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High (₹)</option>
                <option value="price_desc">Price: High to Low (₹)</option>
                <option value="newest">Newest Listings</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Searching service network...</div>
          ) : services.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No services found in this location/criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try expanding your search to adjacent talukas, clearing the PIN code filter, or exploring all service categories.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div 
                      className="h-44 overflow-hidden relative cursor-pointer"
                      onClick={() => onNavigate('service-detail', { id: service.id })}
                    >
                      <img
                        src={service.image_url || '/src/assets/images/category_agri_rural_service_1792827856095.jpg'}
                        alt={service.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                        {service.category_name}
                      </div>

                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-medium text-white">
                        {getModeLabel(service.service_mode)}
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-bold font-mono tabular-nums">{service.rating_avg || 5.0}</span>
                          <span className="text-slate-400">({service.reviews_count || 1})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{service.duration_minutes} min</span>
                      </div>

                      <h3
                        onClick={() => onNavigate('service-detail', { id: service.id })}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                      >
                        {service.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{service.service_area}</span>
                      </div>

                      {/* Provider name info */}
                      <div 
                        onClick={() => onNavigate('provider-detail', { id: service.provider_id })}
                        className="pt-2 flex items-center gap-2 cursor-pointer group border-t border-slate-100"
                      >
                        <img
                          src={service.provider_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                          alt={service.provider_name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs text-slate-600 group-hover:text-blue-600 truncate flex-1">
                          {service.provider_business || service.provider_name}
                        </span>
                        {service.provider_verified === 1 && (
                          <span title="Aadhaar & Trade Verified">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900 font-mono tabular-nums">₹{service.price}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/{service.pricing_unit}</span>
                    </div>

                    <button
                      onClick={() => onOpenBooking(service)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
