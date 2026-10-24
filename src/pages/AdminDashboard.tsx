import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { AdminStats, Category, Booking, EmergencyRequest } from '../types.js';
import { 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Calendar, 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Plus, 
  Layers,
  AlertTriangle,
  Clock,
  BadgeCheck,
  ShieldAlert,
  Phone
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [emergencyFilter, setEmergencyFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'EMERGENCY' | 'CATEGORIES' | 'BOOKINGS'>('PROVIDERS');
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [newCatModal, setNewCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Briefcase');
  const [catSector, setCatSector] = useState<'HOME' | 'AGRI_RURAL' | 'ELECTRONICS' | 'COMMUNITY'>('AGRI_RURAL');
  const [catImage, setCatImage] = useState('/src/assets/images/category_agri_rural_service_1792827856095.jpg');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [s, p, c, b, e] = await Promise.all([
        api.admin.getStats(),
        api.admin.getProviders(),
        api.categories.getAll(),
        api.admin.getBookings(),
        api.emergency.getAll(),
      ]);
      setStats(s);
      setProviders(p);
      setCategories(c);
      setBookings(b);
      setEmergencyRequests(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProvider = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.admin.verifyProvider(id, status);
      setActionMsg(`Provider #${id} status changed to ${status}.`);
      setTimeout(() => setActionMsg(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.categories.create({
        name: catName.trim(),
        description: catDesc.trim(),
        icon_name: catIcon,
        image_url: catImage,
        sector: catSector,
      } as any);
      setNewCatModal(false);
      setCatName('');
      setCatDesc('');
      setActionMsg('New category added successfully.');
      setTimeout(() => setActionMsg(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading administrative controls...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>ServiceHub India · Marketplace Administration & Governance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit Aadhaar credentials, grant verified status to rural & urban specialists, and oversee bookings.
          </p>
        </div>

        <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
          Role: ADMIN (Full Control)
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
          {actionMsg}
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Registered Users</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{stats.totalUsers}</p>
            <span className="text-[10px] text-slate-500">{stats.totalCustomers} clients</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Specialists</span>
            <p className="text-2xl font-extrabold text-blue-600 font-mono mt-1">{stats.totalProviders}</p>
            <span className="text-[10px] text-slate-500">Service providers</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Pending Verifications</span>
            <p className="text-2xl font-extrabold text-amber-600 font-mono mt-1">{stats.pendingProviders}</p>
            <span className="text-[10px] text-amber-700 font-medium">Requires review</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Total Bookings</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{stats.totalBookings}</p>
            <span className="text-[10px] text-slate-500">{stats.completedBookings} completed</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Completed GMV</span>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">₹{stats.totalVolume}</p>
            <span className="text-[10px] text-slate-500">Total volume</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">Marketplace Rating</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1 flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{stats.avgRating}</span>
            </p>
            <span className="text-[10px] text-slate-500">{stats.totalReviews} reviews</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs">
            <span className="text-red-500 font-medium flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              Urgent Alerts
            </span>
            <p className="text-2xl font-extrabold text-red-600 font-mono mt-1">
              {(stats as any)?.openEmergencyRequests || 0}
            </p>
            <span className="text-[10px] text-slate-500">{(stats as any)?.totalEmergencyRequests || 0} total logged</span>
          </div>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Specialist Verification Queue ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab('EMERGENCY')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'EMERGENCY' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-red-700 hover:bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Emergency Requests ({emergencyRequests.length})</span>
          {emergencyRequests.filter(r => r.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold font-mono">
              {emergencyRequests.filter(r => r.status === 'OPEN').length} Open
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'CATEGORIES' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Service Taxonomy ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'BOOKINGS' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Marketplace Bookings ({bookings.length})
        </button>
      </div>

      {/* TAB 1: PROVIDER VERIFICATION */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Aadhaar & Trade Verification</h3>
            <span className="text-slate-500">Audit registrations and approve listing visibility</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="p-3.5 pl-5">Specialist & Trade</th>
                  <th className="p-3.5">District / State / PIN</th>
                  <th className="p-3.5">Rate</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{p.name}</span>
                            {p.aadhaar_verified === 1 && (
                              <span title="Aadhaar Verified">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            )}
                          </p>
                          <p className="text-slate-500 text-[11px]">{p.business_name}</p>
                          <span className="text-[10px] text-slate-400">{p.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-slate-800">{p.district}, {p.state}</p>
                      <span className="text-[11px] text-slate-500 font-mono">PIN: {p.pincode}</span>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ₹{p.hourly_rate}/hr
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        p.verification_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        p.verification_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {p.verification_status}
                      </span>
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      {p.verification_status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerifyProvider(p.id, 'APPROVED')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyProvider(p.id, 'REJECTED')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : p.verification_status === 'APPROVED' ? (
                        <button
                          onClick={() => handleVerifyProvider(p.id, 'REJECTED')}
                          className="px-2.5 py-1 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg cursor-pointer"
                        >
                          Revoke Badge
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyProvider(p.id, 'APPROVED')}
                          className="px-2.5 py-1 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          Re-Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EMERGENCY REPAIRS OVERSIGHT */}
      {activeTab === 'EMERGENCY' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-950 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Marketplace Urgent Repair Requests — Monitoring & Oversight</span>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">
                Total Logged: {emergencyRequests.length}
              </span>
            </div>
            <p className="text-red-800 leading-relaxed text-[11px]">
              Platform monitoring for urgent household containment & repair requests across Indian districts. <strong>Notice:</strong> These are private marketplace repair connections, not official police, fire, or ambulance dispatches.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold text-slate-600">
              {['ALL', 'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setEmergencyFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    emergencyFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={loadAllAdminData}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh Table
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="p-3.5 pl-5">Request & Incident</th>
                  <th className="p-3.5">Customer Contact</th>
                  <th className="p-3.5">District / Address</th>
                  <th className="p-3.5">Assigned Specialist</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Logged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emergencyRequests
                  .filter((r) => emergencyFilter === 'ALL' || r.status === emergencyFilter)
                  .map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-400 text-[11px]">#{req.id}</span>
                            <span className="font-bold text-slate-900">{req.title}</span>
                          </div>
                          <span className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                            req.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.severity} · {req.incident_type}
                          </span>
                          <p className="text-slate-500 text-[11px] max-w-xs truncate" title={req.description}>
                            {req.description}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{req.customer_name}</p>
                        <a href={`tel:${req.customer_phone}`} className="text-blue-600 font-mono text-[11px] hover:underline">
                          {req.customer_phone}
                        </a>
                      </td>

                      <td className="p-3.5">
                        <p className="font-medium text-slate-800">{req.district}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]" title={req.address}>
                          {req.address}
                        </p>
                        {req.pincode && <span className="text-[10px] text-slate-400 font-mono">PIN: {req.pincode}</span>}
                      </td>

                      <td className="p-3.5">
                        {req.assigned_provider_name ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block">{req.assigned_provider_name}</span>
                            <span className="text-[11px] text-slate-500 block">{req.assigned_provider_business}</span>
                            {req.assigned_provider_phone && (
                              <span className="font-mono text-[10px] text-slate-400">{req.assigned_provider_phone}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin text-amber-500" />
                            Unassigned (Open)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          req.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          req.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right font-mono text-slate-400 text-[11px]">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px]">{new Date(req.created_at).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Service Taxonomy & Sectors</h3>
            <button
              onClick={() => setNewCatModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                <img
                  src={c.image_url}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{c.name}</h4>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {c.sector}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-2 mt-0.5">{c.description}</p>
                  <span className="text-[10px] text-blue-600 font-mono mt-1 block">slug: {c.slug}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'BOOKINGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Platform Bookings Audit Log</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="p-3.5 pl-5">Ref #</th>
                  <th className="p-3.5">Service & Amount</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Specialist</th>
                  <th className="p-3.5">Slot</th>
                  <th className="p-3.5 pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-slate-500">#{b.id}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 truncate max-w-xs">{b.service_title}</p>
                      <span className="font-mono font-semibold text-emerald-700">₹{b.total_price}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{b.customer_name}</p>
                      <span className="text-[10px] text-slate-400">{b.customer_email}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{b.provider_name}</p>
                      <span className="text-[10px] text-slate-400">{b.provider_business}</span>
                    </td>
                    <td className="p-3.5 font-mono">
                      {b.booking_date} ({b.time_slot})
                    </td>
                    <td className="p-3.5 pr-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {newCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Create Service Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy Machinery & Veterinary Care"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Market Sector</label>
                <select
                  value={catSector}
                  onChange={(e) => setCatSector(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="AGRI_RURAL">Agriculture & Rural</option>
                  <option value="ELECTRONICS">Electronics & Inverter/RO</option>
                  <option value="HOME">Home & Construction</option>
                  <option value="COMMUNITY">Puja, Events & Training</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Scope of work covered..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCatModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
