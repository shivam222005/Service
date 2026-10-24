import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { ServiceListing } from '../types.js';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Smartphone
} from 'lucide-react';

interface BookingModalProps {
  service: ServiceListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: number) => void;
  onOpenAuth: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM - 11:00 AM');
  const [address, setAddress] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Service / COD');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<number | null>(null);

  if (!isOpen || !service) return null;

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:30 AM - 12:30 PM',
    '02:00 PM - 04:00 PM',
    '04:30 PM - 06:30 PM',
  ];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (user.role !== 'CUSTOMER') {
      setError('You are currently signed in as a Service Provider or Administrator. Please switch to a Client account to book services.');
      return;
    }

    if (!address.trim()) {
      setError('Please provide a complete service address or farm plot details.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.bookings.create({
        service_id: service.id,
        booking_date: date,
        time_slot: timeSlot,
        address: address.trim(),
        pincode: pincode.trim() || undefined,
        district: district.trim() || undefined,
        service_mode: service.service_mode || 'ON_SITE',
        notes: notes.trim() || undefined,
        payment_method: paymentMethod,
      } as any);

      setSuccessBookingId(res.id);
      onSuccess(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to place booking request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Schedule Appointment</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">{service.title}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successBookingId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Service Request Booked!</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your appointment request <strong>#{successBookingId}</strong> has been transmitted to {service.provider_name || 'the specialist'}. You will receive status updates in your dashboard.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-left max-w-xs mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-semibold text-slate-800 font-mono">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-semibold text-slate-800">{timeSlot}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="text-slate-500">Total Due:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">₹{service.price}</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Close & View in Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Specialist & Price Summary */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-700 font-medium">Verified Specialist</p>
                <p className="font-bold text-slate-900 text-xs">{service.provider_name || service.provider_business}</p>
                <p className="text-[11px] text-slate-500">Duration: ~{service.duration_minutes} minutes</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
                  ₹{service.price}
                </p>
                <span className="text-[10px] text-slate-500 capitalize">/{service.pricing_unit}</span>
              </div>
            </div>

            {/* Date and Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preferred Time Window</span>
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs bg-white"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address, PIN Code & District */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Service Address / Farm Plot / Landmark</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Plot No., Street/Village, Near Landmark"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 413102"
                  className="w-full font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District / Taluka</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Baramati, Pune"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>
            </div>

            {/* Access notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Specific Problem Details / Instructions</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 5HP pump tripping, Luminous battery water low, bring ladder..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs resize-none"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash on Service / COD')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'Cash on Service / COD'
                      ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs">Cash on Service (COD)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Pay directly upon work completion</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI / Online Mock (PhonePe/GPay)')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'UPI / Online Mock (PhonePe/GPay)'
                      ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs">UPI (PhonePe / GPay)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Simulated QR / UPI settlement</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ServiceHub India Guarantee: No upfront advance needed. Free cancellation up to 4 hours before slot.</span>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Checking Specialist Availability...</span>
                ) : (
                  <>
                    <span>Confirm & Book Appointment (₹{service.price})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
