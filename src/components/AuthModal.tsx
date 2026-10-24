import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, ShieldCheck, AlertCircle, ArrowRight, BadgeCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'CUSTOMER' | 'SERVICE_PROVIDER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultRole = 'CUSTOMER' }) => {
  const { login, register, quickSwitchUser } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP_CUSTOMER' | 'SIGNUP_PRO'>(
    defaultRole === 'SERVICE_PROVIDER' ? 'SIGNUP_PRO' : 'LOGIN'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Provider specific Indian states
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('6');
  const [hourlyRate, setHourlyRate] = useState('450');
  const [serviceArea, setServiceArea] = useState('Baramati, Daund & Surrounding Talukas');
  const [city, setCity] = useState('Baramati');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('413102');
  const [tradeLicenseNo, setTradeLicenseNo] = useState('MH-AGRI-PMP-2024-8812');
  const [skills, setSkills] = useState('Solar Pump Repair, Submersible Motor Rewinding, Drip Lines');
  const [languages, setLanguages] = useState('Marathi, Hindi, English');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
        onClose();
      } else if (mode === 'SIGNUP_CUSTOMER') {
        await register({
          name,
          email,
          password,
          role: 'CUSTOMER',
          phone,
        });
        onClose();
      } else if (mode === 'SIGNUP_PRO') {
        await register({
          name,
          email,
          password,
          role: 'SERVICE_PROVIDER',
          phone,
          businessName,
          bio,
          experienceYears: Number(experienceYears) || 1,
          hourlyRate: Number(hourlyRate) || 350,
          serviceArea,
          city,
          district,
          state,
          pincode,
          tradeLicenseNo,
          serviceModes: ['ON_SITE', 'WORKSHOP_VISIT'],
          languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {mode === 'LOGIN' ? 'Sign In to ServiceHub' : mode === 'SIGNUP_CUSTOMER' ? 'Register Client Profile' : 'Specialist & Mistri Onboarding'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(null); }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('SIGNUP_CUSTOMER'); setError(null); }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'SIGNUP_CUSTOMER' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Client Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('SIGNUP_PRO'); setError(null); }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'SIGNUP_PRO' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Join as Pro
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 my-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {mode !== 'LOGIN' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rameshwar Patil"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.in"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {mode !== 'LOGIN' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number (WhatsApp Enabled)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98220 00000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          )}

          {/* India Specialist Specific Fields */}
          {mode === 'SIGNUP_PRO' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business / Trade Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kisan Mitra Agro & Solar Services"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Rate (₹ / hr)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postal PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="413102"
                    className="w-full font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Town / Village</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Baramati"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Pune"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  placeholder="e.g. Baramati, Indapur, Daund Talukas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Registration / License No (Optional)</label>
                <input
                  type="text"
                  value={tradeLicenseNo}
                  onChange={(e) => setTradeLicenseNo(e.target.value)}
                  placeholder="MSME / ITI / Trade license"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Skills & Equipment (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Solar Pump, Inverter, Multimeter, Piping"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="Hindi, Marathi, English"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Craftsmanship Statement</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your trade expertise, years on field, and guarantee..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {mode === 'LOGIN' ? 'Sign In to ServiceHub' : mode === 'SIGNUP_CUSTOMER' ? 'Register Profile' : 'Submit Specialist Application'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Switch */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700 mb-1.5">Quick Evaluator Credentials:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await quickSwitchUser('customer');
                onClose();
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 cursor-pointer"
            >
              Client (Pooja)
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickSwitchUser('provider');
                onClose();
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer"
            >
              Agro & Solar (Rameshwar)
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickSwitchUser('admin');
                onClose();
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-amber-400 hover:text-amber-600 cursor-pointer"
            >
              Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
