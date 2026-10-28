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
  Home,
  Navigation,
  Wind,
  Wrench,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface BrowseServicesPageProps {
  initialFilters?: {
    search?: string;
    category?: string;
    city?: string;
    pincode?: string;
    sort?: string;
    providerId?: number;
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
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>(initialFilters?.search || '');
  const [category, setCategory] = useState<string>(initialFilters?.category || '');
  const [city, setCity] = useState<string>(initialFilters?.city || '');
  const [pincode, setPincode] = useState<string>(initialFilters?.pincode || '');
  const [serviceMode, setServiceMode] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [sort, setSort] = useState<string>(initialFilters?.sort || 'rating');

  // Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialFilters?.category) {
      setCategory(initialFilters.category);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchServices();
  }, [category, sort, serviceMode, minRating, userCoords]);

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
    setError(null);
    try {
      const params: any = {
        search: search.trim() || undefined,
        category: category || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        serviceMode: serviceMode || undefined,
        minRating: minRating || undefined,
        sort,
      };

      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }

      if (initialFilters?.providerId) {
        params.providerId = initialFilters.providerId;
      }

      const data = await api.services.getAll(params);
      setServices(data);
    } catch (err: any) {
      console.error('Failed to load services:', err);
      setError(err.message || 'Could not load service catalog.');
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
    setMinRating('');
    setSort('rating');
    setUserCoords(null);
    setTimeout(() => {
      api.services.getAll({ sort: 'rating' }).then(setServices);
    }, 0);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSort('distance');
        setGeoLoading(false);
      },
      (_err) => {
        setGeoLoading(false);
        // Fallback to Pune coordinates for demo testing if permission denied in iframe
        setUserCoords({ lat: 18.5204, lng: 73.8567 });
        setSort('distance');
      },
      { timeout: 8000 }
    );
  };

  // Find active category record for banner
  const activeCategory = categories.find((c) => c.slug === category);

  // Dedicated AC Category Hero Banner configuration
  const isAcCategory = category === 'ac-repair-maintenance' || activeCategory?.slug === 'ac-repair-maintenance';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Hero Banner if a specific category is selected */}
      {isAcCategory ? (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-blue-900/50">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            <div className="p-6 sm:p-10 md:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                <Wind className="w-3.5 h-3.5 text-blue-300" />
                <span>Specialized Cooling & HVAC Care</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                AC Repair & Maintenance
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Certified air conditioning technicians for split & window units. Deep jet coil cleaning, eco-friendly gas refills (R32 / R410A), PCB diagnostics, and copper leak fixes.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-medium text-blue-200">
                <span className="px-2.5 py-1 rounded-lg bg-white/10">Jet Foam Wash (₹599)</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10">Full Gas Refill (₹1899)</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10">PCB Inspection (₹399)</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">90-Day Warranty</span>
              </div>
            </div>
            <div className="h-48 sm:h-64 md:h-full md:col-span-5 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80"
                alt="HVAC Specialist Servicing Air Conditioner"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-transparent to-slate-900/90"></div>
            </div>
          </div>
        </div>
      ) : activeCategory ? (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            <div className="p-6 sm:p-8 md:col-span-8 space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/20 text-white inline-block">
                {activeCategory.sector || 'HOME SERVICES'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeCategory.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {activeCategory.description}
              </p>
            </div>
            <div className="h-36 sm:h-48 md:col-span-4 relative overflow-hidden">
              <img
                src={activeCategory.image_url}
                alt={activeCategory.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-transparent to-slate-900/90"></div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Verified Home & Technical Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search by location, PIN code, or specialty. Connect directly with certified technicians across India.
          </p>
        </div>
      )}

      {/* Main Filter & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs h-fit text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter Directory</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <form onSubmit={handleApplyFilter} className="space-y-4">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Service Keywords</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. AC Jet Wash, Pipe Leak..."
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Category Sector</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800 bg-white cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS Near Me Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={geoLoading}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  userCoords
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                <span>{userCoords ? 'GPS Active (Sorting Nearest)' : 'Find Services Near Me'}</span>
              </button>
            </div>

            {/* City Input */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">City / District</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune, Lucknow"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* PIN Code */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">6-Digit PIN Code</label>
              <input
                type="text"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 411038"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono text-slate-800"
              />
            </div>

            {/* Minimum Rating */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800 bg-white cursor-pointer"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5★ & Above (Top Rated)</option>
                <option value="4.0">4.0★ & Above</option>
                <option value="3.5">3.5★ & Above</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800 bg-white cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                {userCoords && <option value="distance">Nearest Distance (km)</option>}
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newly Listed</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Services Grid Content Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active criteria toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-800">
              {loading ? 'Searching catalog...' : `${services.length} services available`}
            </span>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCategory('')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                  category === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {categories.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.slug)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    category === c.slug ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 animate-pulse">
                  <div className="h-44 bg-slate-200 rounded-2xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State with Retry */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="text-sm font-bold text-red-900">Failed to load service catalog</h3>
              <p className="text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchServices}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State with Suggestions */}
          {!loading && !error && services.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No matching services found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We could not find any active services matching your search criteria. Try removing filters or exploring all categories.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('ac-repair-maintenance')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  View AC Repair Services
                </button>
              </div>
            </div>
          )}

          {/* Services List Grid */}
          {!loading && !error && services.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((serv) => (
                <div
                  key={serv.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Service Image Banner with Verified Badges */}
                    <div className="h-48 overflow-hidden relative bg-slate-100">
                      <img
                        src={serv.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                        alt={serv.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                      
                      {/* Distance Badge if Geolocation is Active */}
                      {typeof serv.distance_km === 'number' && (
                        <div className="absolute top-3 left-3 bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Navigation className="w-3 h-3" />
                          <span>{serv.distance_km} km away</span>
                        </div>
                      )}

                      {/* Duration Tag */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{serv.duration_minutes} mins</span>
                      </div>

                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-blue-200 font-semibold block mb-0.5">
                          {serv.category_name || 'Home Maintenance'}
                        </span>
                        <h3 className="text-base font-bold leading-tight group-hover:text-blue-200 transition-colors">
                          {serv.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {serv.description}
                      </p>

                      {/* Provider Info Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div 
                          onClick={() => onNavigate('provider-detail', { id: serv.provider_id })}
                          className="flex items-center gap-2 cursor-pointer group/pro"
                        >
                          <img
                            src={serv.provider_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={serv.provider_business || serv.provider_name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover/pro:text-blue-600 transition-colors truncate text-xs">
                              {serv.provider_business || serv.provider_name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {serv.provider_city || serv.provider_district || serv.service_area}
                            </p>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{serv.rating_avg || 5.0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Footer */}
                  <div className="p-5 pt-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fixed Price</span>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{serv.price}
                        <span className="text-xs text-slate-400 font-normal"> / {serv.pricing_unit}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(serv)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
