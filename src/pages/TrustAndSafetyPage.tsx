import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Award, FileCheck, HelpCircle } from 'lucide-react';

export const TrustAndSafetyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Trust, Safety & Verification Pledge
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          How ServiceHub protects both homeowners and service specialists through automated integrity checks and administrative auditing.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-slate-900">1. Aadhaar & Trade Credential Auditing</h3>
            <p className="text-slate-600 leading-relaxed">
              Every service professional registers with government identity documents (Aadhaar / PAN), verified mobile numbers, and trade license credentials where applicable. Profiles undergo manual review before the verified trust badge is granted.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-slate-900">2. Anti-Fraud & Authenticated Reviews</h3>
            <p className="text-slate-600 leading-relaxed">
              Reviews can only be submitted by genuine customers who completed an actual service appointment verified by the database engine. Duplicate or fabricated feedback is strictly blocked at the SQL unique constraint layer.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-slate-900">3. Concurrency & Double-Booking Protection</h3>
            <p className="text-slate-600 leading-relaxed">
              Our scheduling engine executes atomic database transactions to guarantee that two clients cannot book the same specialist at the identical date and time slot.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-1">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-slate-900">4. Transparent Upfront Rates in Indian Rupees (₹)</h3>
            <p className="text-slate-600 leading-relaxed">
              No hidden travel surcharges or surprise billing. The confirmed quote in ₹ is what you pay upon completion via UPI or Cash on Delivery (COD).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
