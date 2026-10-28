import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Booking, BookingStatus, EmergencyRequest } from '../types.js';
import { ReviewModal } from '../components/ReviewModal.js';
import { BookingTimeline } from '../components/BookingTimeline.js';
import { useRealtime } from '../hooks/useRealtime.js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Star, 
  AlertCircle, 
  CreditCard,
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
  RefreshCw,
  Truck,
  QrCode,
  FileText
} from 'lucide-react';
import { CustomerPaymentModal } from '../components/CustomerPaymentModal.js';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal.js';

interface CustomerDashboardProps {
  onNavigate: (tab: string, meta?: any) => void;
  onOpenEmergency: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate, onOpenEmergency }) => {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);

  // Payment modal state
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<Booking | null>(null);
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] = useState<boolean>(false);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Action feedback notice
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Real-time synchronization
  useRealtime({
    onBookingUpdate: () => {
      loadBookings(false);
    },
    onEmergencyUpdate: () => {
      loadEmergencyRequests();
    },
  });

  useEffect(() => {
    loadBookings(true);
    loadEmergencyRequests();

    // Polling fallback
    const interval = setInterval(() => {
      loadBookings(false);
      loadEmergencyRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadEmergencyRequests = async () => {
    try {
      const data = await api.emergency.getAll();
      setEmergencyRequests(data);
    } catch (err) {
      console.error('Failed to load emergency requests:', err);
    }
  };

  const handleCancelEmergency = async (id: number) => {
    try {
      await api.emergency.updateStatus(id, 'CANCELLED');
      setActionNotice({ type: 'success', message: `Emergency request #${id} was cancelled.` });
      setTimeout(() => setActionNotice(null), 4000);
      loadEmergencyRequests();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to cancel emergency request.' });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const loadBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.bookings.getAll();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await api.bookings.updateStatus(id, 'CANCELLED', 'Cancelled by customer from dashboard');
      setActionNotice({ type: 'success', message: `Booking request #${id} cancelled.` });
      setTimeout(() => setActionNotice(null), 4000);
      loadBookings(false);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to cancel booking.' });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await api.auth.updateProfile({ name, phone });
      await refreshUser();
      setEditingProfile(false);
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile.');
    }
  };

  // Real backend calculations
  const totalCount = bookings.length;
  const activeBookings = bookings.filter((b) => 
    ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_PAYMENT'].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_PAYMENT'].includes(b.status);
    if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'REJECTED';
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Pending Specialist Confirmation</span>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">Appointment Confirmed</span>;
      case 'ON_THE_WAY':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 animate-pulse"><Truck className="w-3.5 h-3.5" /> Specialist On The Way</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">Service In Progress</span>;
      case 'AWAITING_PAYMENT':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5 text-amber-700" /> Awaiting Payment</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Completed · Paid</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Cancelled</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">Specialist Unavailable</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
          actionNotice.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white cursor-pointer ml-4">✕</button>
        </div>
      )}

      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name.split(' ')[0]} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Track your upcoming household bookings, review specialist milestones, and manage past service records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('browse')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer transition-colors inline-flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Book New Service</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingProfile(!editingProfile)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            {editingProfile ? 'Close Profile' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Edit Drawer if Open */}
      {editingProfile && (
        <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-4 text-xs animate-in fade-in duration-200">
          <h3 className="text-sm font-extrabold text-slate-900">Update Profile Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98220 XXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Save Profile Changes
            </button>
            {profileMsg && <span className="font-medium text-emerald-600">{profileMsg}</span>}
          </div>
        </form>
      )}

      {/* Booking Summary Cards (Accurate Real Database Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">{totalCount}</p>
          <span className="text-[11px] text-slate-500">All-time appointments</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs space-y-1 bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Active / En Route</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono tabular-nums">{activeBookings.length}</p>
          <span className="text-[11px] text-blue-600 font-medium">In progress or scheduled</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">{completedBookings.length}</p>
          <span className="text-[11px] text-slate-500">Successfully closed</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">₹{totalSpent.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">Verified services</span>
        </div>
      </div>

      {/* Emergency Requests Section if customer submitted any */}
      {emergencyRequests.length > 0 && (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Your Urgent Emergency Help Requests</span>
            </div>
            <button
              onClick={onOpenEmergency}
              className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
            >
              Report New Emergency
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyRequests.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded-2xl border border-red-200 shadow-2xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{req.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    req.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                    req.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                    req.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{req.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Location: {req.district}</span>
                  {req.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => handleCancelEmergency(req.id)}
                      className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: `All Bookings (${bookings.length})` },
              { id: 'ACTIVE', label: `Active (${activeBookings.length})` },
              { id: 'COMPLETED', label: `Completed (${completedBookings.length})` },
              { id: 'CANCELLED', label: `Cancelled (${cancelledBookings.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p>Loading your appointments...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No bookings in this tab</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Looking for AC maintenance, plumbing help, or electricians? Browse verified specialists in your area.
              </p>
            </div>
            <button
              onClick={() => onNavigate('browse')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Explore Services
            </button>
          </div>
        )}

        {/* Bookings List Cards with Embedded BookingTimeline */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-6">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-6"
              >
                {/* Header: Service Title, Ref ID & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 font-semibold">Ref #{b.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium">Booked {b.created_at.split('T')[0]}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {b.service_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Milestone Progress Timeline */}
                <BookingTimeline
                  status={b.status}
                  timeline={b.timeline}
                  createdAt={b.created_at}
                />

                {/* Booking Details & Provider Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  {/* Column 1: Time & Location */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b.booking_date} ({b.time_slot})</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{b.address}{b.pincode ? ` - ${b.pincode}` : ''}</span>
                    </div>
                  </div>

                  {/* Column 2: Provider Details */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Assigned Specialist</span>
                    <p className="font-extrabold text-slate-900">{b.provider_business || b.provider_name}</p>
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{b.provider_phone || '+91 Direct Contact'}</span>
                    </div>
                  </div>

                  {/* Column 3: Payment & Actions */}
                  <div className="flex flex-col justify-between items-start sm:items-end space-y-2">
                    <div className="sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Amount</span>
                      <p className="text-lg font-extrabold text-slate-900">₹{b.total_price}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        b.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.payment_status === 'PAID' ? 'Paid via UPI' : 'Pay Post-Service / COD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Pay action if AWAITING_PAYMENT */}
                      {b.status === 'AWAITING_PAYMENT' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentBooking(b);
                            setShowCustomerPaymentModal(true);
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Scan QR / Pay via UPI</span>
                        </button>
                      )}

                      {/* Cancel action if pending/accepted */}
                      {['PENDING', 'ACCEPTED'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      )}

                      {/* Tax Invoice & Receipt button for completed bookings */}
                      {b.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceiptBooking(b);
                            setShowReceiptModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="View Tax Invoice & Receipt"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Invoice</span>
                        </button>
                      )}

                      {/* Review action for completed bookings */}
                      {b.status === 'COMPLETED' && !b.has_reviewed && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewBooking(b);
                            setReviewModalOpen(true);
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Rate Specialist</span>
                        </button>
                      )}

                      {b.status === 'COMPLETED' && b.has_reviewed && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Feedback Submitted</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={reviewModalOpen}
          booking={reviewBooking}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewBooking(null);
          }}
          onSuccess={() => {
            setReviewModalOpen(false);
            setReviewBooking(null);
            loadBookings(false);
            setActionNotice({ type: 'success', message: 'Thank you! Your verified review has been published.' });
            setTimeout(() => setActionNotice(null), 4000);
          }}
        />
      )}

      {/* Customer QR & UPI Pay Modal */}
      {showCustomerPaymentModal && selectedPaymentBooking && (
        <CustomerPaymentModal
          booking={selectedPaymentBooking}
          isOpen={showCustomerPaymentModal}
          onClose={() => {
            setShowCustomerPaymentModal(false);
            setSelectedPaymentBooking(null);
            loadBookings(false);
          }}
          onPaymentSuccess={() => {
            loadBookings(false);
          }}
        />
      )}

      {/* Tax Invoice & Receipt Modal */}
      {showReceiptModal && selectedReceiptBooking && (
        <PaymentReceiptModal
          booking={selectedReceiptBooking}
          receipt={null}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptBooking(null);
          }}
        />
      )}
    </div>
  );
};
