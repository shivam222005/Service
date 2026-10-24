import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                ServiceHub India
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The full-stack on-demand service marketplace connecting verified home, agriculture, electrical, and ceremony specialists with Indian residents across metros, talukas, and villages.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              <p>College Major Project · Built with React 19, TypeScript, Tailwind CSS, Node.js Express, and persistent SQLite.</p>
            </div>
          </div>

          {/* Column 1: Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Marketplace Sectors</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('browse', { category: 'agriculture-rural' })} className="hover:text-white transition-colors cursor-pointer">
                  Agriculture & Solar Pumps
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse', { category: 'electronics-inverter-ro' })} className="hover:text-white transition-colors cursor-pointer">
                  Inverter, Solar & RO Repair
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse', { category: 'home-cleaning' })} className="hover:text-white transition-colors cursor-pointer">
                  Home Deep Cleaning & Pest
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse', { category: 'electrical-smart-home' })} className="hover:text-white transition-colors cursor-pointer">
                  Electrical & EV Charging
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse', { category: 'puja-vedic-events' })} className="hover:text-white transition-colors cursor-pointer">
                  Puja & Vedic Ceremonies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-white transition-colors cursor-pointer text-blue-400">
                  View All Sectors →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Professionals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">For Specialists</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  Specialist Onboarding
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('trust-safety')} className="hover:text-white transition-colors cursor-pointer">
                  Verification Standards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition-colors cursor-pointer">
                  Service Pricing Guides
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                  Partner Support
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Trust & Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('trust-safety')} className="hover:text-white transition-colors cursor-pointer">
                  Safety Guarantee
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                  Customer Assistance
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ServiceHub Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Engineered for Academic Major Project</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Mock Backend & Persistent SQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
