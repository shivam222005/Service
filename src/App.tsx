import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { NotificationsModal } from './components/NotificationsModal.js';
import { BookingModal } from './components/BookingModal.js';
import { EmergencyHelpModal } from './components/EmergencyHelpModal.js';
import { AiAssistantModal } from './components/AiAssistantModal.js';
import { HomePage } from './pages/HomePage.js';
import { BrowseServicesPage } from './pages/BrowseServicesPage.js';
import { ServiceDetailPage } from './pages/ServiceDetailPage.js';
import { ProviderProfilePage } from './pages/ProviderProfilePage.js';
import { CustomerDashboard } from './pages/CustomerDashboard.js';
import { ProviderDashboard } from './pages/ProviderDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { HowItWorksPage } from './pages/HowItWorksPage.js';
import { TrustAndSafetyPage } from './pages/TrustAndSafetyPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage.js';
import { ServiceListing } from './types.js';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [tabMeta, setTabMeta] = useState<any>({});

  // Modals
  const [authOpen, setAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'CUSTOMER' | 'SERVICE_PROVIDER'>('CUSTOMER');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bookingService, setBookingService] = useState<ServiceListing | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [emergencyHelpOpen, setEmergencyHelpOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const navigateTo = (tab: string, meta: any = {}) => {
    setCurrentTab(tab);
    setTabMeta(meta);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (role: 'CUSTOMER' | 'SERVICE_PROVIDER' = 'CUSTOMER') => {
    setAuthRole(role);
    setAuthOpen(true);
  };

  const handleOpenBooking = (service: ServiceListing) => {
    setBookingService(service);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (_bookingId: number) => {
    // Keep modal open on success screen or navigate
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={navigateTo}
        onOpenAuth={handleOpenAuth}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenEmergency={() => setEmergencyHelpOpen(true)}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onOpenBooking={handleOpenBooking}
            onOpenAuth={handleOpenAuth}
            onOpenEmergency={() => setEmergencyHelpOpen(true)}
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
          />
        )}

        {currentTab === 'browse' && (
          <BrowseServicesPage
            initialFilters={tabMeta}
            onNavigate={navigateTo}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentTab === 'categories' && (
          <CategoriesPage onNavigate={navigateTo} />
        )}

        {currentTab === 'service-detail' && tabMeta.id && (
          <ServiceDetailPage
            serviceId={tabMeta.id}
            onNavigate={navigateTo}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'provider-detail' && tabMeta.id && (
          <ProviderProfilePage
            providerId={tabMeta.id}
            onNavigate={navigateTo}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentTab === 'customer-dashboard' && (
          <CustomerDashboard 
            onNavigate={navigateTo} 
            onOpenEmergency={() => setEmergencyHelpOpen(true)}
          />
        )}

        {currentTab === 'pro-dashboard' && (
          <ProviderDashboard />
        )}

        {currentTab === 'admin-dashboard' && (
          <AdminDashboard />
        )}

        {currentTab === 'how-it-works' && (
          <HowItWorksPage onNavigate={navigateTo} onOpenAuth={handleOpenAuth} />
        )}

        {currentTab === 'trust-safety' && (
          <TrustAndSafetyPage />
        )}

        {currentTab === 'contact' && (
          <ContactPage />
        )}

        {(currentTab === 'terms' || currentTab === 'privacy') && (
          <TermsPrivacyPage />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Global Modals */}
      <AuthModal
        isOpen={authOpen}
        defaultRole={authRole}
        onClose={() => setAuthOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={navigateTo}
      />

      <BookingModal
        service={bookingService}
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingService(null);
        }}
        onSuccess={handleBookingSuccess}
        onOpenAuth={() => handleOpenAuth('CUSTOMER')}
      />

      <EmergencyHelpModal
        isOpen={emergencyHelpOpen}
        onClose={() => setEmergencyHelpOpen(false)}
        currentUser={user}
        onNavigate={navigateTo}
      />

      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        onNavigate={navigateTo}
        onOpenBooking={handleOpenBooking}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
