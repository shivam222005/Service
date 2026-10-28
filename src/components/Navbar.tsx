import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldAlert,
  Sparkles,
  CalendarCheck,
  Search,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenAuth: (defaultRole?: 'CUSTOMER' | 'SERVICE_PROVIDER') => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
  onOpenAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
  onOpenEmergency,
  onOpenAiAssistant,
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
    if (user.role === 'SERVICE_PROVIDER') return 'Specialist Workspace';
    return 'My Bookings';
  };

  const handleBookingsClick = () => {
    if (!user) {
      onOpenAuth('CUSTOMER');
    } else if (user.role === 'CUSTOMER') {
      onNavigate('customer-dashboard');
    } else if (user.role === 'SERVICE_PROVIDER') {
      onNavigate('pro-dashboard');
    } else {
      onNavigate('admin-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs">
      {/* Demo Persona Quick-Switch Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide uppercase text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            India Local & Rural Marketplace Demo
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">Instant RBAC Persona Switcher:</span>
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
          <span className="text-slate-700">|</span>
          <button
            onClick={() => quickSwitchUser('provider')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              user?.role === 'SERVICE_PROVIDER' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Specialist Pro (Rameshwar)
          </button>
          <span className="text-slate-700">|</span>
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

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo & Brand Name */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer whitespace-nowrap shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors font-sans block leading-none">
                ServiceHub
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block mt-0.5">
                India Marketplace
              </span>
            </div>
          </button>

          {/* Functional Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'home' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'browse' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Explore Services
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'categories' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => onNavigate('browse', { sort: 'rating' })}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Find Professionals</span>
            </button>

            {/* AI Assistant Button in Nav with Sparkles */}
            <button
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200/80 transition-colors font-semibold text-xs cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>AI Assistant</span>
            </button>

            {/* My Bookings link */}
            <button
              onClick={handleBookingsClick}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'customer-dashboard' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>My Bookings</span>
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Highly Visible Emergency Help Button */}
            <button
              onClick={onOpenEmergency}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold tracking-tight shadow-sm shadow-red-500/25 cursor-pointer transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>Emergency Help</span>
            </button>

            {/* Prominent Book a Service Button */}
            <button
              onClick={() => onNavigate('browse')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 hover:shadow-md cursor-pointer whitespace-nowrap"
            >
              <span>Book a Service</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  aria-label="View notifications"
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dashboard Shortcut */}
                <button
                  onClick={() => onNavigate(getDashboardTab())}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
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
                    className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 transition-all cursor-pointer bg-white shadow-2xs"
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
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setRoleDropdownOpen(false)}
                    >
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
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
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 cursor-pointer font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('CUSTOMER')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('SERVICE_PROVIDER')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Join as Pro
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 text-sm font-medium">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEmergency();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>Emergency Help</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAiAssistant();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Assistant</span>
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('home');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Home
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('browse');
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Explore Services
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
              onNavigate('browse', { sort: 'rating' });
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            Find Professionals
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleBookingsClick();
            }}
            className="block w-full text-left py-2 text-slate-700 hover:text-blue-600"
          >
            My Bookings
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('browse');
            }}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm text-center"
          >
            Book a Service Now
          </button>
        </div>
      )}
    </header>
  );
};
