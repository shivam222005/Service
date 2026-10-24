import React from 'react';
import { 
  Search, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  Star, 
  ArrowRight, 
  CheckCircle2,
  Users,
  Briefcase
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (tab: string, meta?: any) => void;
  onOpenAuth: (role?: 'CUSTOMER' | 'SERVICE_PROVIDER') => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How ServiceHub Operates
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Engineered for complete transparency, guaranteed appointments, and vetted craftsmanship.
        </p>
      </div>

      {/* For Customers */}
      <section className="space-y-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">For Homeowners & Clients</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center font-mono text-sm">1</span>
            <h3 className="font-bold text-slate-900 text-sm">Discover Local Specialists</h3>
            <p className="text-slate-600 leading-relaxed">
              Filter by 6-digit PIN code, district, delivery mode (Farm visit, Doorstep, Workshop), and Aadhaar verification status.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center font-mono text-sm">2</span>
            <h3 className="font-bold text-slate-900 text-sm">Select Your Preferred Slot</h3>
            <p className="text-slate-600 leading-relaxed">
              Pick your date and 2-hour window. Real-time SQL concurrency locks protect against conflicting bookings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center font-mono text-sm">3</span>
            <h3 className="font-bold text-slate-900 text-sm">Specialist Arrival & Work</h3>
            <p className="text-slate-600 leading-relaxed">
              Track live status updates in your dashboard from "Accepted" to "In Progress" to "Completed" with automated alerts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center font-mono text-sm">4</span>
            <h3 className="font-bold text-slate-900 text-sm">Pay Upon Completion in ₹</h3>
            <p className="text-slate-600 leading-relaxed">
              Settle via UPI (GPay, PhonePe, Paytm) or Cash on Service / COD, then leave an authenticated customer review.
            </p>
          </div>
        </div>
      </section>

      {/* For Service Providers */}
      <section className="space-y-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Briefcase className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900">For Indian Specialists, Mistris & Technicians</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center font-mono text-sm">A</span>
            <h3 className="font-bold text-slate-900 text-sm">Register & Submit Aadhaar Details</h3>
            <p className="text-slate-600 leading-relaxed">
              Provide your government ID (Aadhaar / PAN), trade license, language capabilities, and service district. Administrators audit every application.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center font-mono text-sm">B</span>
            <h3 className="font-bold text-slate-900 text-sm">Publish Services in ₹ & PIN Coverage</h3>
            <p className="text-slate-600 leading-relaxed">
              Define your pricing in Indian Rupees, select your service delivery modes, and specify the exact postal PIN codes you cover.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center font-mono text-sm">C</span>
            <h3 className="font-bold text-slate-900 text-sm">Accept Direct Bookings & Grow</h3>
            <p className="text-slate-600 leading-relaxed">
              Receive direct booking requests from clients across your city or rural cluster. Accept appointments and build your verified reputation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to Experience ServiceHub?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Start browsing verified specialists or register your trade business today.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('browse')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Find a Specialist
          </button>
          <button
            onClick={() => onOpenAuth('SERVICE_PROVIDER')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
          >
            Join as Professional
          </button>
        </div>
      </div>
    </div>
  );
};
