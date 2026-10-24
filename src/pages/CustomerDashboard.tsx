import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Booking, BookingStatus } from '../types.js';
import { ReviewModal } from '../components/ReviewModal.js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  Star, 
  AlertCircle, 
  CreditCard,
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { EmergencyRequest } from '../types.js';

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

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
    loadEmergencyRequests();
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
    if (!window.confirm('Are you sure you want to cancel this emergency repair request?')) return;
    try {
      await api.emergency.updateStatus(id, 'CANCELLED');
      loadEmergencyRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request.');
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.bookings.getAll();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api.bookings.updateStatus(id, 'CANCELLED');
      loadBookings();
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.updateProfile({ name, phone });
      await refreshUser();
      setProfileMsg('Profile successfully updated.');
      setEditingProfile(false);
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status);
    if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200"><Clock3 className="w-3 h-3" /> Awaiting Confirmation</span>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-blue-200"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-indigo-200"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200"><XCircle className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{user?.name}</h1>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Customer Account
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              {user?.phone && <span>·</span>}
              {user?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditingProfile(!editingProfile)}
          className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
        >
          {editingProfile ? 'Close Editor' : 'Edit Profile'}
        </button>
      </div>

      {profileMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
          {profileMsg}
        </div>
      )}

      {/* Profile Edit Form */}
      {editingProfile && (
        <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-lg text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Update Contact Information</h3>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditingProfile(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Emergency Help Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-sm border border-red-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-red-950/60 text-red-100 uppercase tracking-widest text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                Emergency Protocol
              </span>
              <span className="text-red-100 font-mono text-[11px]">Free 24x7 Safety Help</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Suspected LPG Leak, Electrical Sparking or Burst Water Pipe?
            </h3>
            <p className="text-red-100 leading-relaxed text-[11px] max-w-xl">
              Access instant official helplines (1906 / 112 / 101) & safety guides or request urgent vetted repair assistance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEmergency}
          className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-transform hover:scale-105 inline-flex items-center justify-center gap-1.5"
        >
          <span>Open Emergency Help</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Emergency Requests Section (If Any) */}
      {emergencyRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-slate-900">
                Your Urgent Emergency Repair Requests ({emergencyRequests.length})
              </h3>
            </div>
            <button
              onClick={loadEmergencyRequests}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh Status
            </button>
          </div>

          <div className="space-y-3">
            {emergencyRequests.map((req) => (
              <div 
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">Request #{req.id}</span>
                    <span className="font-bold text-slate-900">{req.title}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'CANCELLED'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Logged: {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Details:</strong> {req.description}
                </p>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                  <span>Location: {req.address}, {req.district}</span>
                  {req.pincode && <span>· PIN: {req.pincode}</span>}
                </div>

                {/* Assigned Specialist Info */}
                {req.assigned_provider_name ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-blue-950">
                      <span className="font-bold block">Assigned Specialist: {req.assigned_provider_name}</span>
                      <span className="text-[11px] text-blue-700">{req.assigned_provider_business}</span>
                    </div>
                    {req.assigned_provider_phone && (
                      <a
                        href={`tel:${req.assigned_provider_phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-mono font-bold text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call {req.assigned_provider_phone}
                      </a>
                    )}
                  </div>
                ) : req.status === 'OPEN' ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-amber-700 text-[11px] flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      Alert broadcasted to verified local specialists in {req.district}. Awaiting acceptance...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancelEmergency(req.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Service Bookings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track appointment status, reschedule requests, and post reviews</p>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : tab === 'COMPLETED' ? 'Completed' : 'Cancelled'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading your bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No bookings in this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You don't have any appointments matching this status. Explore our verified specialists to book your next service.
            </p>
            <button
              onClick={() => onNavigate('browse')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getStatusBadge(booking.status)}
                    <span className="text-[11px] text-slate-400 font-mono">Ref #{booking.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-500 font-medium">Booked {new Date(booking.created_at).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {booking.service_title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-semibold text-slate-800">{booking.booking_date}</span>
                      <span className="text-slate-400">({booking.time_slot})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Specialist: <strong>{booking.provider_business || booking.provider_name}</strong></span>
                      {booking.provider_phone && <span className="text-slate-400 font-mono">({booking.provider_phone})</span>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.payment_method} · Status: <strong>{booking.payment_status}</strong></span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                      Special note: "{booking.notes}"
                    </p>
                  )}
                </div>

                {/* Right side actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Amount</span>
                    <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      ₹{booking.total_price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If completed and not yet reviewed */}
                    {booking.status === 'COMPLETED' && !booking.has_reviewed && (
                      <button
                        onClick={() => {
                          setReviewBooking(booking);
                          setReviewModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {booking.status === 'COMPLETED' && booking.has_reviewed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3 h-3" />
                        Reviewed
                      </span>
                    )}

                    {/* Can cancel if pending or accepted */}
                    {['PENDING', 'ACCEPTED'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        booking={reviewBooking}
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewBooking(null);
        }}
        onSuccess={() => {
          loadBookings();
        }}
      />
    </div>
  );
};
