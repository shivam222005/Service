import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Category, ServiceListing, ProviderProfile } from '../types.js';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Wrench,
  Zap,
  Hammer,
  ChevronRight,
  Tractor,
  Cpu,
  Flame,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, meta?: any) => void;
  onOpenBooking: (service: ServiceListing) => void;
  onOpenAuth: (defaultRole?: 'CUSTOMER' | 'SERVICE_PROVIDER') => void;
  onOpenEmergency: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenBooking,
  onOpenAuth,
  onOpenEmergency,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<ServiceListing[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationTerm, setLocationTerm] = useState('Pune');
  const [pincodeTerm, setPincodeTerm] = useState('');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [cats, servs, provs] = await Promise.all([
        api.categories.getAll(),
        api.services.getAll({ limit: 6, sort: 'rating' }),
        api.providers.getAll(),
      ]);
      setCategories(cats);
      setFeaturedServices(servs.slice(0, 4));
      setProviders(provs.slice(0, 4));
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('browse', {
      search: searchTerm,
      category: selectedCategory,
      city: locationTerm,
      pincode: pincodeTerm,
    });
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative pt-6 sm:pt-10 lg:pt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full w-fit border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aadhaar & Trade-Verified Specialists · Across Cities, Talukas & Villages</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Skilled local professionals, <br className="hidden sm:inline" />
              for every home, farm & business.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              From agricultural solar pump mechanics and inverter technicians in rural talukas to certified electric vehicle chargers and home deep cleaning across Indian metros.
            </p>

            {/* Urgent Emergency Quick-Response Card */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950/60 text-red-100 uppercase tracking-widest text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      Emergency Help Desk
                    </span>
                    <span className="text-red-100 font-mono text-[11px]">Free Instant Access</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Household Emergency? (LPG Leak, Electrical Spark, Burst Pipe, Fire)
                  </h3>
                  <p className="text-red-100 leading-relaxed text-[11px] sm:text-xs max-w-xl">
                    Access official Indian emergency helplines (1906 / 112 / 101) & safety instructions immediately without login, or request urgent vetted repair assistance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenEmergency}
                className="px-5 py-2.5 bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-transform hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                <span>Get Emergency Help Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Comprehensive Search Bar Strip (India Localized with PIN code & District) */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-2 items-stretch text-xs"
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Service (e.g. Solar Pump, Inverter, Cleaning)"
                  className="w-full text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="sm:w-36 flex items-center gap-1.5 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  placeholder="City / District"
                  className="w-full text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="sm:w-28 flex items-center px-2 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                <input
                  type="text"
                  value={pincodeTerm}
                  maxLength={6}
                  onChange={(e) => setPincodeTerm(e.target.value)}
                  placeholder="PIN code"
                  className="w-full font-mono text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="sm:w-44 flex items-center px-2 py-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-slate-700 bg-transparent focus:outline-none cursor-pointer py-1"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Filter Indian Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="font-semibold text-slate-700">Popular In India:</span>
              <button
                type="button"
                onClick={() => onNavigate('browse', { category: 'agriculture-rural' })}
                className="hover:text-blue-600 cursor-pointer underline decoration-slate-300 underline-offset-4"
              >
                Solar Pumps & Drip
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigate('browse', { category: 'electronics-inverter-ro' })}
                className="hover:text-blue-600 cursor-pointer underline decoration-slate-300 underline-offset-4"
              >
                Inverter & Battery
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigate('browse', { category: 'home-cleaning' })}
                className="hover:text-blue-600 cursor-pointer underline decoration-slate-300 underline-offset-4"
              >
                Festival Deep Clean
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigate('browse', { category: 'puja-vedic-events' })}
                className="hover:text-blue-600 cursor-pointer underline decoration-slate-300 underline-offset-4"
              >
                Griha Pravesh Puja
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex items-center">
            <div className="w-full h-80 sm:h-96 lg:h-full min-h-[400px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 relative group">
              <img
                src="/src/assets/images/hero_india_servicehub_1792827855340.jpg"
                alt="ServiceHub India verified technicians and service professionals on duty"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-emerald-600 rounded text-[11px] font-semibold tracking-wide flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Aadhaar Verified Professional
                  </span>
                  <span className="text-xs text-slate-300 font-mono">Baramati · MH</span>
                </div>
                <h3 className="text-lg font-bold">Rameshwar Patil & Partner Specialists</h3>
                <p className="text-xs text-slate-200">Kisan Mitra Solar Pumps & Agro Repairs · 5.0 ★ (11 yrs exp)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Proof Metrics Row */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">12,400+</p>
            <p className="text-xs text-slate-500 mt-0.5">Homes & Farms Served</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">600+ PIN Codes</p>
            <p className="text-xs text-slate-500 mt-0.5">Cities, Talukas & Villages</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">100%</p>
            <p className="text-xs text-slate-500 mt-0.5">Aadhaar & Skill Audited</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">4.9 / 5</p>
            <p className="text-xs text-slate-500 mt-0.5">Verified Customer Rating</p>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories Section (India Localized) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Essential Service Sectors</h2>
            <p className="text-xs text-slate-500 mt-1">From farm equipment & power backup to home hygiene and sacred rituals</p>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>All Categories</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('browse', { category: cat.slug })}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="h-44 overflow-hidden relative bg-slate-100">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-slate-300 block mb-0.5">
                    {cat.sector === 'AGRI_RURAL' ? 'Rural & Agriculture' : cat.sector === 'ELECTRONICS' ? 'Power & Diagnostics' : cat.sector === 'COMMUNITY' ? 'Cultural & Events' : 'Home Services'}
                  </span>
                  <h3 className="font-bold text-sm tracking-tight">{cat.name}</h3>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Browse Specialists</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Services (In INR ₹) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verified Service Listings</h2>
            <p className="text-xs text-slate-500 mt-1">Directly book trusted professionals with transparent pricing in Rupees</p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service) => (
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

                  <div 
                    onClick={() => onNavigate('provider-detail', { id: service.provider_id })}
                    className="pt-2 flex items-center gap-2 cursor-pointer group"
                  >
                    <img
                      src={service.provider_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                      alt={service.provider_name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-xs text-slate-600 group-hover:text-blue-600 truncate">
                      {service.provider_business || service.provider_name}
                    </span>
                    {service.provider_verified === 1 && (
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
      </section>

      {/* 4. Verified Indian Specialists Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Meet Verified Master Craftsmen</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Every professional undergoes identity verification with Aadhaar records, trade certifications, and quality audits before joining the marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.map((pro: any) => (
              <div
                key={pro.id}
                onClick={() => onNavigate('provider-detail', { id: pro.id })}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 hover:bg-slate-800 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={pro.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                      alt={pro.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-600"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-sm text-white">{pro.name}</h4>
                        {pro.verified_badge === 1 && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{pro.business_name}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {pro.bio}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{pro.rating_avg || 5.0}</span>
                    <span className="text-slate-400 font-normal">({pro.reviews_count || 0})</span>
                  </div>
                  <span className="text-slate-300 font-mono">₹{pro.hourly_rate}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How ServiceHub Operates</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Transparent, direct on-demand service across India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base font-mono">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900">Search by District or PIN Code</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Find nearby specialists in your taluka, village or city ward. Compare rates, verified customer reviews, and service modes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base font-mono">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900">Select Date & Preferred Window</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Book a confirmed morning, afternoon or evening slot. Transactional concurrency guards prevent overlapping bookings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base font-mono">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900">Pay on Completion (Cash/UPI)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specialist arrives on-site or handles at workshop. Pay upon completion using Cash or UPI (GPay/PhonePe), then post a verified review.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Become a Pro Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-700 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-700/10">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Are You a Skilled Specialist or Mistri?</h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Expand your earnings across towns and villages. Get verified with Aadhaar and start receiving direct customer bookings with zero commission middleman fees.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenAuth('SERVICE_PROVIDER')}
              className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              Join ServiceHub Partner Network
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
