import React from 'react';

export const TermsPrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-xs leading-relaxed text-slate-600">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Terms of Service & Privacy Policy</h1>
        <p className="text-slate-400">Last updated: October 2026 · Academic Major Project Documentation</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Academic & Demonstrative Purpose</h2>
        <p>
          ServiceHub is an on-demand marketplace built as a college major software engineering project. All booking records, provider profiles, and transactions created within this environment run against an integrated local relational SQLite database engine. Real monetary charges are neither collected nor stored.
        </p>

        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Role-Based Access Control (RBAC)</h2>
        <p>
          The system strictly enforces server-side role boundaries. Customers are authorized to schedule bookings and post verified feedback only for completed services they personally initiated. Service Professionals can publish services, set pricing units, and transition appointments through valid business lifecycles. System Administrators maintain privileged access to approve pending providers and moderate content.
        </p>

        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Data Privacy & Passwords</h2>
        <p>
          User passwords are encrypted server-side using cryptographic salt hashing (bcrypt with 10 salt rounds). Authentication sessions are validated using signed JSON Web Tokens (JWT). Private contact details are masked from public listings until a customer confirms a booking with the specific specialist.
        </p>

        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Concurrency & Scheduling Guarantees</h2>
        <p>
          Booking submissions are protected by transactional SQL constraints that inspect provider availability prior to insert operations, ensuring robust multi-client integrity and preventing double bookings.
        </p>
      </div>
    </div>
  );
};
