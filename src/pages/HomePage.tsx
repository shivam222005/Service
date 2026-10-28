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
  ShieldAlert,
  Wind,
  Droplets,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Users,
  ChevronDown,
  HelpCircle,
  Award
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, meta?: any) => void;
  onOpenBooking: (service: ServiceListing) => void;
  onOpenAuth: (defaultRole?: 'CUSTOMER' | 'SERVICE_PROVIDER') => void;
  onOpenEmergency: () => void;
  onOpenAiAssistant: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenBooking,
  onOpenAuth,
  onOpenEmergency,
  onOpenAiAssistant,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<ServiceListing[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationTerm, setLocationTerm] = useState('Pune');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [cats, servs, provs] = await Promise.all([
        api.categories.getAll(),
        api.services.getAll({ sort: 'rating' }),
        api.providers.getAll(),
      ]);
      setCategories(cats);
      setFeaturedServices(servs);
      setProviders(provs.filter(p => p.verification_status === 'APPROVED'));
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('browse', {
      search: searchTerm.trim() || undefined,
      category: selectedCategory || undefined,
      city: locationTerm.trim() || undefined,
    });
  };

  // 6 Primary Popular Category Slugs requested by user
  const popularSlugs = [
    'ac-repair-maintenance',
    'plumbing-water-tanks',
    'electrical-smart-home',
    'home-cleaning',
    'carpentry-woodwork',
    'appliance-repair'
  ];

  // Match existing categories in database or fallback to all
  const popularCategories = popularSlugs
    .map(slug => categories.find(c => c.slug === slug))
    .filter((c): c is Category => Boolean(c));

  // If some popular categories are still loading, fallback to first 6
  const displayedCategories = popularCategories.length >= 4 
    ? popularCategories 
    : categories.slice(0, 6);

  // Curated AC services specifically for AC highlight
  const acServices = featuredServices.filter(s => 
    s.category_slug === 'ac-repair-maintenance' || 
    s.title.toLowerCase().includes('ac') || 
    s.title.toLowerCase().includes('air condition')
  );

  return (
    <div className="space-y-16 lg:space-y-24 pb-20 bg-slate-50">
      {/* 1. Hero Section (Two Column: Left headlines & search, Right verified pro composition) */}
      <section className="relative pt-8 sm:pt-12 lg:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Small trust badge */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Your Local Service Partner · Verified Specialists Across India</span>
            </div>

            {/* Large headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Trusted Home Services, <br />
              <span className="text-blue-600">Made Simple.</span>
            </h1>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              ServiceHub connects homeowners, farms, and businesses with Aadhaar-verified technicians for AC repair, plumbing, electrical installations, deep cleaning, and carpentry.
            </p>

            {/* Urgent Household Emergency Alert Strip */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950/60 text-red-100 uppercase tracking-widest text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      Emergency Help Desk
                    </span>
                    <span className="text-red-100 font-mono text-[11px]">Free Instant Access</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    LPG Gas Leak, Electrical Spark, or Burst Pipe?
                  </h3>
                  <p className="text-red-100 leading-relaxed text-[11px] sm:text-xs max-w-lg">
                    Access immediate safety protocols and official emergency helplines (1906 / 112) without login, or request urgent specialist dispatch.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenEmergency}
                className="px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-transform hover:scale-105 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Emergency Help</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Functional Service Search Field */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 flex flex-col sm:flex-row gap-2 items-stretch text-xs"
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Service (e.g. AC Repair, Plumber, Cleaning)"
                  className="w-full text-slate-900 placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="sm:w-44 flex items-center gap-1.5 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  placeholder="City / Area (e.g. Pune)"
                  className="w-full text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="sm:w-48 flex items-center px-2 py-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-slate-700 bg-transparent focus:outline-none cursor-pointer py-1 text-xs"
                >
                  <option value="">All Service Sectors</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Primary & Secondary Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('browse', { sort: 'rating' })}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Find a Professional</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>AI Service Assistant</span>
              </button>
            </div>
          </div>

          {/* Right Column: Premium Home-Services Visual Composition with Technician */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              <div className="h-96 sm:h-[460px] overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80"
                  alt="Certified ServiceHub technician servicing air conditioner unit"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-emerald-600 rounded-md text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-xs">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Aadhaar & Trade Verified
                    </span>
                    <span className="text-xs text-slate-300 font-mono">Pune Metro · MH</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold">Rahul Shinde & Certified Team</h3>
                  <p className="text-xs text-slate-200">CoolAir Pro HVAC Solutions · 5.0 ★ (8 yrs experience)</p>
                </div>
              </div>

              {/* Floating Information Card 1: Top Right */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-extrabold text-slate-900 leading-tight">100% Verified</p>
                  <p className="text-slate-500 text-[11px]">Background Audited</p>
                </div>
              </div>

              {/* Floating Information Card 2: Bottom Left */}
              <div className="absolute bottom-24 left-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-extrabold text-slate-900 leading-tight">Instant Confirmation</p>
                  <p className="text-slate-500 text-[11px]">Real-time Tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item Proof Metrics Row */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">12,400+</p>
            <p className="text-xs text-slate-500 mt-0.5">Homes & Farms Served</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">600+ PIN Codes</p>
            <p className="text-xs text-slate-500 mt-0.5">Cities, Talukas & Villages</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">100%</p>
            <p className="text-xs text-slate-500 mt-0.5">Aadhaar Audited Specialists</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">4.9 / 5.0</p>
            <p className="text-xs text-slate-500 mt-0.5">Customer Satisfaction</p>
          </div>
        </div>
      </section>

      {/* 2. Popular Service Categories (6 image cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <span>Verified Specialties</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Service Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Professional, certified technicians ready to visit your home with upfront pricing and verified reviews.
            </p>
          </div>

          <button
            onClick={() => onNavigate('categories')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Explore All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Category Image Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('browse', { category: cat.slug })}
              className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-52 overflow-hidden relative bg-slate-100">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/20 backdrop-blur-md text-white mb-1.5 inline-block">
                      {cat.sector || 'HOME'}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-blue-600 border-t border-slate-100 mt-2">
                <span>View Matching Specialists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured AC Repair & Maintenance Section (User Highlight Request) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                <Wind className="w-3.5 h-3.5 text-blue-300" />
                <span>Specialized HVAC & Cooling Solutions</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                AC Repair & Maintenance Services
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Beat the heat with certified air conditioning technicians. High-pressure jet coil wash, anti-microbial foam cleaning, gas leakage detection, and PCB circuit repair with 90-day service warranty.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <p className="text-base sm:text-lg font-bold text-white">₹599</p>
                  <p className="text-[11px] text-slate-300">Jet Foam Cleaning</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <p className="text-base sm:text-lg font-bold text-white">45 Mins</p>
                  <p className="text-[11px] text-slate-300">Fast Doorstep Service</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-base sm:text-lg font-bold text-white">90 Days</p>
                  <p className="text-[11px] text-slate-300">Cooling Warranty</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('browse', { category: 'ac-repair-maintenance' })}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-colors inline-flex items-center gap-2"
                >
                  <span>Book AC Service Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  <span>Diagnose AC Issues</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative h-72 sm:h-80">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80"
                  alt="Technician performing AC jet pump cleaning"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white text-xs">
                    <p className="font-bold">Split & Window AC Jet Cleaning</p>
                    <p className="text-slate-300 text-[11px]">Daikin · Voltas · LG · Blue Star · Carrier</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Professionals (Actual Approved Records from Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <span>Audited Specialists</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Local Professionals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Meet top-rated service partners with verified trade experience, transparent rates, and real customer reviews.
            </p>
          </div>

          <button
            onClick={() => onNavigate('browse', { sort: 'rating' })}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>View All Professionals</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real Provider Cards */}
        {providers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No verified professionals listed yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first certified professional to join ServiceHub India in your district!
            </p>
            <button
              onClick={() => onOpenAuth('SERVICE_PROVIDER')}
              className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Join as Service Professional
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.slice(0, 4).map((pro) => (
              <div
                key={pro.user_id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Avatar and Verification */}
                  <div className="flex items-start justify-between">
                    <img
                      src={pro.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={pro.business_name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    {pro.verified_badge === 1 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Business and Category Info */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {pro.business_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pro.service_area || `${pro.city}, ${pro.district}`}</span>
                    </div>
                  </div>

                  {/* Rating & Experience */}
                  <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{pro.rating_avg || 5.0}</span>
                      <span className="text-slate-400 font-normal">({pro.reviews_count || 1})</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium">
                      {pro.experience_years} yrs exp
                    </div>
                  </div>

                  {/* Hourly Rate / Starting Price */}
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Starting from</span>
                    <span className="text-slate-900 font-bold text-sm">
                      ₹{pro.hourly_rate} <span className="text-xs text-slate-400 font-normal">/ visit</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onNavigate('provider-detail', { id: pro.user_id })}
                    className="w-full py-2 px-2 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('browse', { providerId: pro.user_id })}
                    className="w-full py-2 px-2 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. How It Works (Simple 3 Steps with clean icons) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How ServiceHub Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Get quality service delivered to your doorstep in 3 effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                Step 1
              </span>
              <h3 className="font-extrabold text-base text-slate-900">Choose a Service</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Browse our verified catalog or describe your problem to our Gemini-powered AI diagnostic assistant.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                Step 2
              </span>
              <h3 className="font-extrabold text-base text-slate-900">Select a Suitable Professional</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Compare verified specialist credentials, upfront transparent prices, service areas, and authentic customer ratings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                Step 3
              </span>
              <h3 className="font-extrabold text-base text-slate-900">Book and Track Your Service</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Select your preferred appointment slot and follow real-time progress on your live milestone tracker.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI Service Assistant Introduction Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-8 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Smart Maintenance Problem Diagnoser</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Not sure what service you need?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Tell our AI Service Assistant what happened (e.g. &quot;My AC is blowing warm air&quot; or &quot;bathroom pipe is making a loud banging sound&quot;). It immediately identifies the technical issue, offers safety precautions, and finds verified local professionals.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Launch AI Assistant</span>
          </button>
        </div>
      </section>

      {/* 7. Why Choose ServiceHub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Choose ServiceHub
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A marketplace engineered for trustworthiness, quality, and complete transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Aadhaar & License Verified</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every provider is vetted with identity checks, trade certifications, and in-person skill evaluation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Upfront Transparent Pricing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized rate cards in Indian Rupees (INR) with zero hidden charges or unexpected add-ons.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Real-time Live Milestones</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              WebSocket-synchronized live tracking keeps you updated from request confirmation to job completion.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">90-Day Service Warranty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete peace of mind with our dedicated customer protection guarantee and verified feedback loop.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about booking, verified specialists, and guarantees.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does ServiceHub verify service professionals?',
              a: 'Every specialist undergoes government Aadhaar identity verification, trade license auditing, and background vetting before their listings are approved by platform administrators.'
            },
            {
              q: 'Can I cancel or reschedule my service appointment?',
              a: 'Yes, you can easily cancel or reschedule your booking directly from your Customer Dashboard while the status is in Pending or Accepted state with zero cancellation fee.'
            },
            {
              q: 'What payment methods are supported?',
              a: 'We support all major Indian payment options including UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery / Post-Service payment.'
            },
            {
              q: 'How does the Gemini AI Service Assistant work?',
              a: 'Our AI Service Assistant analyzes your plain text description of a problem, diagnoses probable causes, gives immediate safety guidance, and directly matches verified professionals in your area.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Final Booking Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to get your household tasks done?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Book certified AC mechanics, plumbers, electricians, and cleaners across your city or taluka today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Book a Service Now
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('SERVICE_PROVIDER')}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Become a Service Partner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
