import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Booking, ServiceListing, Category, BookingStatus, ServiceMode, EmergencyRequest, EmergencyStatus } from '../types.js';
import { 
  Briefcase, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Star, 
  User, 
  MapPin, 
  Trash2, 
  Edit,
  ShieldCheck,
  Building,
  BadgeCheck,
  ShieldAlert,
  Phone
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user, providerProfile, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'EMERGENCY' | 'SERVICES' | 'PROFILE'>('BOOKINGS');

  // Emergency Requests state
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loadingEmergency, setLoadingEmergency] = useState<boolean>(true);
  const [emergencyActionMsg, setEmergencyActionMsg] = useState<string | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [bookingFilter, setBookingFilter] = useState<string>('ALL');

  // Services state
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

  // Create Service Modal
  const [newServiceModal, setNewServiceModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPrice, setNewPrice] = useState('499');
  const [newPricingUnit, setNewPricingUnit] = useState('per visit');
  const [newDuration, setNewDuration] = useState('60');
  const [newServiceMode, setNewServiceMode] = useState<ServiceMode>('ON_SITE');
  const [newDescription, setNewDescription] = useState('');
  const [newArea, setNewArea] = useState('District & Local Talukas');
  const [newPincodes, setNewPincodes] = useState('413102, 411038');
  const [createError, setCreateError] = useState<string | null>(null);

  // Profile Edit
  const [businessName, setBusinessName] = useState(providerProfile?.business_name || '');
  const [bio, setBio] = useState(providerProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(String(providerProfile?.hourly_rate || 450));
  const [serviceArea, setServiceArea] = useState(providerProfile?.service_area || '');
  const [city, setCity] = useState(providerProfile?.city || '');
  const [district, setDistrict] = useState(providerProfile?.district || '');
  const [state, setState] = useState(providerProfile?.state || '');
  const [pincode, setPincode] = useState(providerProfile?.pincode || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
    loadServices();
    loadCategories();
    loadEmergencyRequests();
  }, []);

  const loadEmergencyRequests = async () => {
    setLoadingEmergency(true);
    try {
      const data = await api.emergency.getAll();
      setEmergencyRequests(data);
    } catch (err) {
      console.error('Failed to load emergency requests:', err);
    } finally {
      setLoadingEmergency(false);
    }
  };

  const handleAcceptEmergency = async (id: number) => {
    try {
      const res = await api.emergency.accept(id);
      setEmergencyActionMsg(res.message);
      setTimeout(() => setEmergencyActionMsg(null), 4000);
      await loadEmergencyRequests();
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to accept urgent repair request.');
    }
  };

  const handleUpdateEmergencyStatus = async (id: number, status: EmergencyStatus) => {
    try {
      const res = await api.emergency.updateStatus(id, status);
      setEmergencyActionMsg(res.message);
      setTimeout(() => setEmergencyActionMsg(null), 4000);
      await loadEmergencyRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update emergency status.');
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await api.bookings.getAll();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadServices = async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      const data = await api.services.getAll({ providerId: user.id });
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.categories.getAll();
      setCategories(cats);
      if (cats.length > 0) setNewCategoryId(String(cats[0].id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: BookingStatus) => {
    try {
      await api.bookings.updateStatus(bookingId, status);
      await loadBookings();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await api.services.create({
        category_id: Number(newCategoryId),
        title: newTitle.trim(),
        description: newDescription.trim(),
        price: Number(newPrice),
        pricing_unit: newPricingUnit,
        duration_minutes: Number(newDuration),
        service_mode: newServiceMode,
        service_area: newArea.trim(),
        pincodes_covered: newPincodes.trim(),
        image_url: categories.find(c => String(c.id) === String(newCategoryId))?.image_url || '/src/assets/images/category_agri_rural_service_1792827856095.jpg'
      } as any);

      setNewServiceModal(false);
      setNewTitle('');
      setNewDescription('');
      await loadServices();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create service listing.');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm('Delete this service listing?')) return;
    try {
      await api.services.delete(id);
      await loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service.');
    }
  };

  const handleToggleServiceStatus = async (service: ServiceListing) => {
    const nextStatus = service.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.services.update(service.id, { status: nextStatus });
      await loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.updateProfile({
        business_name: businessName,
        bio,
        hourly_rate: Number(hourlyRate),
        service_area: serviceArea,
        city,
        district,
        state,
        pincode,
      });
      await refreshUser();
      setProfileSuccessMsg('Profile settings saved successfully.');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  // KPIs
  const pendingRequests = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedAppointments = bookings.filter((b) => ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length;
  const completedJobs = bookings.filter((b) => b.status === 'COMPLETED').length;

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'ALL') return true;
    if (bookingFilter === 'PENDING') return b.status === 'PENDING';
    if (bookingFilter === 'CONFIRMED') return ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status);
    if (bookingFilter === 'COMPLETED') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Status Banner */}
      {providerProfile && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
          providerProfile.verification_status === 'APPROVED'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
            : providerProfile.verification_status === 'PENDING'
            ? 'bg-amber-50/80 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold flex items-center gap-1.5">
                <span>Account Status: {providerProfile.verification_status}</span>
                {providerProfile.aadhaar_verified === 1 && (
                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-semibold">
                    Aadhaar Audited
                  </span>
                )}
              </p>
              <p className="text-[11px] opacity-90">
                {providerProfile.verification_status === 'APPROVED'
                  ? 'Your trade credentials and location jurisdiction are verified. Your listings are active for clients across your district.'
                  : 'Your registration is under administrator review. You can create draft listings and test workflows.'}
              </p>
            </div>
          </div>
          {providerProfile.verification_status === 'APPROVED' && (
            <span className="font-mono font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0">
              Verified Partner
            </span>
          )}
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Pending Requests</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {pendingRequests}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Upcoming / Scheduled</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tabular-nums mt-1">
            {confirmedAppointments}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Completed Jobs</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            {completedJobs}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Client Rating</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>{providerProfile?.rating_avg || 5.0}</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'BOOKINGS' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Appointments & Jobs ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('EMERGENCY')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'EMERGENCY' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-red-700 hover:bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Urgent Repair Alerts ({emergencyRequests.length})</span>
          {emergencyRequests.filter(r => r.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold font-mono">
              {emergencyRequests.filter(r => r.status === 'OPEN').length} New
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'SERVICES' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'PROFILE' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Trade Profile & Coverage Area
        </button>
      </div>

      {emergencyActionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {emergencyActionMsg}
        </div>
      )}

      {/* TAB: EMERGENCY REPAIR REQUESTS */}
      {activeTab === 'EMERGENCY' && (
        <div className="space-y-6">
          {/* Header Notice */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-950 font-bold">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Marketplace Urgent Repair Requests — Rapid Assistance Portal</span>
            </div>
            <p className="text-red-800 leading-relaxed text-[11px]">
              These are urgent household maintenance and containment requests reported by local residents (e.g. leaking valves after gas isolation, electrical panel shorts, burst pipes). They are independent marketplace requests, <strong>not official government emergency dispatches</strong>.
            </p>
            {providerProfile?.verification_status !== 'APPROVED' && (
              <div className="mt-2 p-2.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold">
                Your trade profile is currently pending verification. You may review alerts, but only approved professionals can accept urgent repair dispatches.
              </div>
            )}
          </div>

          {/* Requests List */}
          {loadingEmergency ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading urgent alerts...</div>
          ) : emergencyRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">No Urgent Repair Alerts</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No open emergency repair requests currently pending in your coverage jurisdiction ({providerProfile?.district || 'your area'}).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencyRequests.map((req) => {
                const isAssignedToMe = req.assigned_provider_id === user?.id;
                const canAccept = req.status === 'OPEN' && providerProfile?.verification_status === 'APPROVED';

                return (
                  <div
                    key={req.id}
                    className={`bg-white p-5 rounded-2xl border transition-all space-y-3.5 ${
                      isAssignedToMe 
                        ? 'border-blue-300 ring-2 ring-blue-500/10'
                        : req.status === 'OPEN'
                        ? 'border-red-200 shadow-xs'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">Alert #{req.id}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{req.title}</h4>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          req.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.severity}
                        </span>
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

                      <span className="text-[11px] text-slate-400 font-mono">
                        Reported: {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs space-y-2">
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <strong>Description:</strong> {req.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-[11px] pt-1">
                        <div>
                          <strong>Client:</strong> {req.customer_name}
                        </div>
                        <div>
                          <strong>Contact Phone:</strong>{' '}
                          <a href={`tel:${req.customer_phone}`} className="font-mono font-bold text-blue-600 hover:underline">
                            {req.customer_phone}
                          </a>
                        </div>
                        <div>
                          <strong>District / Area:</strong> {req.district} {req.pincode ? `(PIN: ${req.pincode})` : ''}
                        </div>
                        <div>
                          <strong>Address:</strong> {req.address}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {isAssignedToMe ? (
                          <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            Assigned to you ({user?.name})
                          </span>
                        ) : req.assigned_provider_name ? (
                          <span className="text-xs text-slate-500">
                            Handled by {req.assigned_provider_name}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">
                            Awaiting specialist acceptance
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canAccept && (
                          <button
                            type="button"
                            onClick={() => handleAcceptEmergency(req.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Accept Urgent Request</span>
                          </button>
                        )}

                        {isAssignedToMe && req.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateEmergencyStatus(req.id, 'IN_PROGRESS')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Mark En Route / In Progress
                          </button>
                        )}

                        {isAssignedToMe && req.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateEmergencyStatus(req.id, 'RESOLVED')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Mark Job Resolved
                          </button>
                        )}

                        <a
                          href={`tel:${req.customer_phone}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Client</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Incoming Service Requests</h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    bookingFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'CONFIRMED' ? 'Confirmed' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500">
              No appointments found in this view.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">#{booking.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-700' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">Requested {new Date(booking.created_at).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{booking.service_title}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold font-mono text-slate-800">{booking.booking_date}</span>
                        <span className="text-slate-400">({booking.time_slot})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Client: <strong>{booking.customer_name}</strong></span>
                        {booking.customer_phone && <span className="text-slate-400 font-mono">({booking.customer_phone})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{booking.address} {booking.pincode && `(PIN: ${booking.pincode})`}</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
                        Client instructions: "{booking.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Service Rate</span>
                      <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">₹{booking.total_price}</span>
                      <span className="text-[10px] text-slate-500 block">{booking.payment_method}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'ACCEPTED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer shadow-xs"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'REJECTED')}
                            className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl font-medium cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer"
                        >
                          Confirm Schedule
                        </button>
                      )}

                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
                        >
                          Start Service
                        </button>
                      )}

                      {booking.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold cursor-pointer"
                        >
                          Mark as Completed
                        </button>
                      )}

                      {booking.status === 'COMPLETED' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Job Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVICES */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Published Service Catalog</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control pricing in Indian Rupees, delivery modes, and coverage area</p>
            </div>
            <button
              onClick={() => setNewServiceModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Listing</span>
            </button>
          </div>

          {loadingServices ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your services...</div>
          ) : services.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-3">
              <p>You haven't created any service listings yet.</p>
              <button
                onClick={() => setNewServiceModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Create First Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between space-y-4 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-blue-600">{service.category_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        service.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {service.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{service.title}</h4>
                    <p className="text-slate-600 line-clamp-2">{service.description}</p>
                    
                    <div className="text-[11px] text-slate-500">
                      Duration: {service.duration_minutes} min · Mode: {service.service_mode} · Area: {service.service_area}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900 font-mono">₹{service.price}</span>
                      <span className="text-slate-500 text-[10px] ml-1">/{service.pricing_unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleServiceStatus(service)}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        {service.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-base">Specialist & Jurisdiction Settings</h3>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium">
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business or Trade Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Hourly Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal PIN Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Town</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coverage Area & Talukas</label>
              <input
                type="text"
                required
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Craftsmanship Statement & Experience</label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      {newServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Publish Service Listing</h3>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Tubewell Pump Diagnostic & Motor Check"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pricing Unit</label>
                  <select
                    value={newPricingUnit}
                    onChange={(e) => setNewPricingUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="per visit">Per Visit</option>
                    <option value="fixed">Fixed Job</option>
                    <option value="per hour">Per Hour</option>
                    <option value="per acre / bigha">Per Acre / Bigha</option>
                    <option value="per sq ft">Per Sq Ft</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Mode</label>
                  <select
                    value={newServiceMode}
                    onChange={(e) => setNewServiceMode(e.target.value as ServiceMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="ON_SITE">On-Site (Client Home/Farm)</option>
                    <option value="AT_SHOP">At Workshop</option>
                    <option value="REMOTE">Remote Advisory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Coverage Area</label>
                  <input
                    type="text"
                    required
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="e.g. Baramati, Daund & Surrounding"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Covered PIN Codes</label>
                  <input
                    type="text"
                    value={newPincodes}
                    onChange={(e) => setNewPincodes(e.target.value)}
                    placeholder="e.g. 413102, 411038"
                    className="w-full font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the technical tasks performed, equipment used, and service terms..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewServiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
