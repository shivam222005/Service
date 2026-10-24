import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ServiceListing, Review, ServiceMode } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { 
  Star, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Banknote, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
  Smartphone
} from 'lucide-react';

interface ServiceDetailPageProps {
  serviceId: number;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenAuth: () => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceId,
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<{ service: ServiceListing; reviews: Review[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState<string>('08:00 AM - 10:00 AM');
  const [address, setAddress] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Service / COD');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessId, setBookingSuccessId] = useState<number | null>(null);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    setLoading(true);
    try {
      const res = await api.services.getById(serviceId);
      setData(res);
      if (res.service.provider_district) setDistrict(res.service.provider_district);
    } catch (err: any) {
      setError(err.message || 'Failed to load service listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (user.role !== 'CUSTOMER') {
      setBookingError('Please switch to a Client account to place bookings.');
      return;
    }

    if (!address.trim()) {
      setBookingError('Please enter a service delivery or farm plot address.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await api.bookings.create({
        service_id: serviceId,
        booking_date: date,
        time_slot: timeSlot,
        address: address.trim(),
        pincode: pincode.trim() || undefined,
        district: district.trim() || undefined,
        service_mode: data?.service.service_mode || 'ON_SITE',
        notes: notes.trim() || undefined,
        payment_method: paymentMethod,
      } as any);
      setBookingSuccessId(res.id);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to schedule booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Loading service details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-red-600 text-sm">{error || 'Service not found.'}</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Browse
        </button>
      </div>
    );
  }

  const { service, reviews } = data;

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:30 AM - 12:30 PM',
    '02:00 PM - 04:00 PM',
    '04:30 PM - 06:30 PM',
  ];

  const getModeLabel = (mode: ServiceMode) => {
    switch (mode) {
      case 'ON_SITE':
        return 'On-Site (At Client Home/Farm)';
      case 'AT_SHOP':
        return 'At Specialist Workshop';
      case 'REMOTE':
        return 'Remote Advisory / Video Call';
      case 'TRAVEL':
        return 'Travel-Based Field Service';
      default:
        return mode;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Category Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={() => onNavigate('browse')}
          className="flex items-center gap-1.5 hover:text-slate-900 font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span>{service.category_name}</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs">{service.title}</span>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Visual */}
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 h-80 sm:h-96 relative">
            <img
              src={service.image_url || '/src/assets/images/category_agri_rural_service_1792827856095.jpg'}
              alt={service.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-slate-900 shadow-xs">
              {service.category_name}
            </div>

            <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-medium text-white shadow-xs">
              Mode: {getModeLabel(service.service_mode)}
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-3 pb-6 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1 text-slate-900 font-semibold">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono tabular-nums text-sm">{service.rating_avg || 5.0}</span>
                <span className="text-slate-400 font-normal">({reviews.length} verified reviews)</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{service.duration_minutes} mins duration</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{service.service_area}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {service.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              {service.description}
            </p>
          </div>

          {/* Included In Service */}
          <div className="space-y-3 pb-6 border-b border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Service Scope & Quality Assurance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Government Aadhaar & trade credentials verified</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Standard diagnostic tools & testing kits included</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Transparent billing: No unannounced travel surcharges</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Post-completion test run walkthrough</span>
              </div>
            </div>
          </div>

          {/* Specialist Profile Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={service.provider_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={service.provider_name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{service.provider_name}</h4>
                  {service.provider_verified === 1 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">{service.provider_business}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {service.provider_experience || 5} yrs exp · {service.provider_city}, {service.provider_district}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('provider-detail', { id: service.provider_id })}
              className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              View Full Profile & Reviews
            </button>
          </div>

          {/* Customer Reviews Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Customer & Farmer Feedback ({reviews.length})
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono text-sm">{service.rating_avg || 5.0}</span>
                <span className="text-slate-400 font-normal">/ 5</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                No customer reviews submitted yet. Be the first to book and share feedback!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.customer_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                          alt={rev.customer_name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{rev.customer_name}</p>
                          <span className="text-[10px] text-slate-400">Verified Completed Service</span>
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

                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Card in INR (₹) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 space-y-5 text-xs">
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Standard Fixed Rate</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  ₹{service.price}
                </span>
                <span className="text-xs text-slate-500 ml-1">/{service.pricing_unit}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 font-semibold block">Slots Available</span>
                <span className="text-[10px] text-slate-400">Direct booking</span>
              </div>
            </div>

            {bookingSuccessId ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Appointment Request Sent!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Booking #{bookingSuccessId} created. The specialist will confirm the slot shortly.
                </p>
                <button
                  onClick={() => onNavigate('customer-dashboard')}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-sm text-xs"
                >
                  Go to My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Date Picker */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Service Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={defaultDateStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Preferred Time Slot</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Address & PIN code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Service Address / Farm Plot / Village</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Plot No., Street/Village, Near Landmark"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 413102"
                      className="w-full font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Pune, Lucknow"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Problem Summary / Instructions</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe equipment model, symptom, or special requests..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Payment Option */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash on Service / COD')}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'Cash on Service / COD'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-semibold ring-1 ring-blue-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs">Cash on Service</p>
                        <p className="text-[10px] text-slate-500 font-normal">Pay pro directly</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI / Online Mock (PhonePe/GPay)')}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'UPI / Online Mock (PhonePe/GPay)'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-semibold ring-1 ring-blue-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs">UPI (PhonePe/GPay)</p>
                        <p className="text-[10px] text-slate-500 font-normal">Simulated QR</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Service Fee</span>
                    <span className="font-mono tabular-nums">₹{service.price}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ServiceHub Platform Fee</span>
                    <span className="font-mono text-emerald-600 font-medium">₹0 (Free Demo)</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 mt-1">
                    <span>Total Due</span>
                    <span className="font-mono text-base text-emerald-700 tabular-nums">₹{service.price}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {bookingLoading ? 'Checking Slot Availability...' : `Confirm & Book Appointment (₹${service.price})`}
                </button>
              </form>
            )}

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free cancellation up to 4 hours prior</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
