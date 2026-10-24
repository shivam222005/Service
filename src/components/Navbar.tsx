import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle,
  Menu,
  X,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenAuth: (defaultRole?: 'CUSTOMER' | 'SERVICE_PROVIDER') => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
  onOpenEmergency,
}) => {
  const { user, unreadCount, logout, quickSwitchUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const getDashboardTab = () => {
    if (!user) return 'home';
    if (user.role === 'ADMIN') return 'admin-dashboard';
    if (user.role === 'SERVICE_PROVIDER') return 'pro-dashboard';
    return 'customer-dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'ADMIN') return 'Admin Portal';
    if (user.role === 'SERVICE_PROVIDER') return 'Pro Dashboard';
    return 'My Bookings';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Demo Persona Quick-Switch Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide uppercase text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            India Local & Rural Marketplace Demo
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">Towns, Villages & Cities RBAC Switcher:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => quickSwitchUser('customer')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              user?.role === 'CUSTOMER' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Client (Pooja)
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => quickSwitchUser('provider')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              user?.role === 'SERVICE_PROVIDER' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Agro & Solar Pro (Rameshwar)
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => quickSwitchUser('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              user?.role === 'ADMIN' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Administrator
          </button>
        </div>
      </div>

      {/* Main Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 single-line text links) — Zone 3 (1 primary action or profile) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Wordmark */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer whitespace-nowrap shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors font-sans">
              ServiceHub
            </span>
          </button>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('browse')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'browse' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Browse Services
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'categories' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'how-it-works' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('trust-safety')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'trust-safety' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Trust & Safety
            </button>
          </nav>

          {/* Zone 3: Primary Action / User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Highly Visible Emergency Help Button */}
            <button
              onClick={onOpenEmergency}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold tracking-tight shadow-xs shadow-red-500/25 cursor-pointer transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Emergency Help</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  aria-label="View notifications"
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dashboard Button */}
                <button
                  onClick={() => onNavigate(getDashboardTab())}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    currentTab === getDashboardTab()
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{getDashboardLabel()}</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 transition-all cursor-pointer bg-white"
                  >
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {roleDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs"
                      onMouseLeave={() => setRoleDropdownOpen(false)}
                    >
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-slate-500 truncate">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-600">
                          <span>Role: {user.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onNavigate(getDashboardTab());
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>Go to {getDashboardLabel()}</span>
                      </button>

                      {user.role === 'CUSTOMER' && (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onNavigate('browse');
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <span>Find Services</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          logout();
                          onNavigate('home');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onOpenAuth('CUSTOMER')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('SERVICE_PROVIDER')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                >
                  Join as Pro
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 text-sm font-medium">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenEmergency();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-red-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer mb-2"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>Emergency Help & Safety Helplines</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('browse');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Browse Services
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('categories');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Categories
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('how-it-works');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            How It Works
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('trust-safety');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Trust & Safety
          </button>
          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate(getDashboardTab());
              }}
              className="block w-full text-left py-2 text-blue-600 font-semibold"
            >
              {getDashboardLabel()}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
