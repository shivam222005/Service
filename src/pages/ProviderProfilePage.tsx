import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ProviderProfile, ServiceListing, Review, ServiceMode } from '../types.js';
import { 
  Star, 
  MapPin, 
  CheckCircle, 
  Briefcase, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  BadgeCheck,
  Building,
  Home,
  Check
} from 'lucide-react';

interface ProviderProfilePageProps {
  providerId: number;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenBooking: (service: ServiceListing) => void;
}

export const ProviderProfilePage: React.FC<ProviderProfilePageProps> = ({
  providerId,
  onNavigate,
  onOpenBooking,
}) => {
  const [data, setData] = useState<{
    provider: any;
    services: ServiceListing[];
    reviews: Review[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProvider();
  }, [providerId]);

  const loadProvider = async () => {
    setLoading(true);
    try {
      const res = await api.providers.getById(providerId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load specialist profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Loading specialist profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-red-600 text-sm">{error || 'Provider not found.'}</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const { provider, services, reviews } = data;

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'ON_SITE':
        return 'On-Site (At Client Home/Farm)';
      case 'WORKSHOP_VISIT':
      case 'AT_SHOP':
        return 'At Specialist Workshop';
      case 'REMOTE':
        return 'Remote Advisory';
      case 'TRAVEL_SERVICE':
      case 'TRAVEL':
        return 'Travel Across Taluka/District';
      default:
        return mode;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('browse')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Browse</span>
      </button>

      {/* Specialist Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <img
              src={provider.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={provider.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{provider.name}</h1>
                {provider.verified_badge === 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Specialist
                  </span>
                )}
                {provider.aadhaar_verified === 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <Check className="w-3 h-3 text-blue-600" />
                    Aadhaar Audited
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-700">{provider.business_name}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-mono tabular-nums">{provider.rating_avg || 5.0}</span>
                  <span className="text-slate-400 font-normal">({provider.reviews_count || 0} reviews)</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{provider.experience_years} years experience</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{provider.city}, {provider.district} ({provider.state}) · PIN {provider.pincode}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
            <span className="text-xs text-slate-400 uppercase font-medium">Visiting Rate</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{provider.hourly_rate}
              <span className="text-xs font-normal text-slate-500 ml-1">/ hour</span>
            </p>
            {provider.trade_license_no && (
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Reg: {provider.trade_license_no}
              </span>
            )}
          </div>
        </div>

        {/* Bio & Scope */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Trade Background & Specialization</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {provider.bio}
            </p>
          </div>

          {/* Delivery Modes & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Supported Service Delivery Modes:</span>
              <div className="flex flex-wrap gap-1.5">
                {(provider.service_modes || ['ON_SITE']).map((m: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                    {getModeLabel(m)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Languages Spoken:</span>
              <div className="flex flex-wrap gap-1.5">
                {(provider.languages || ['Hindi', 'English']).map((l: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          {provider.skills && provider.skills.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Verified Technical Skills:</span>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services List in INR ₹ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Services Offered</h2>
        
        {services.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            This specialist has not published any active listings yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-blue-600 font-semibold">{service.category_name}</span>
                    <span>{service.duration_minutes} min</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{service.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{service.description}</p>
                </div>

                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">₹{service.price}</span>
                    <span className="text-xs text-slate-500 ml-1">/{service.pricing_unit}</span>
                  </div>

                  <button
                    onClick={() => onOpenBooking(service)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Book Slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Verified Feedback ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No reviews yet for this professional.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.customer_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                      alt={rev.customer_name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{rev.customer_name}</p>
                      <span className="text-[10px] text-slate-400">Verified Client · {rev.service_title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed pt-1">
                  "{rev.comment}"
                </p>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  {new Date(rev.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
