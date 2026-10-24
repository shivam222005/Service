import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ProviderProfile } from '../types.js';
import { api, getStoredToken } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  providerProfile: ProviderProfile | null;
  unreadCount: number;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickSwitchUser: (type: 'customer' | 'provider' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setProviderProfile(null);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }
      const data = await api.auth.me();
      setUser(data.user);
      setProviderProfile(data.providerProfile || null);
      setUnreadCount(data.unreadNotifications || 0);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      api.auth.logout();
      setUser(null);
      setProviderProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await api.auth.login(email, pass);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      await api.auth.register(data);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setProviderProfile(null);
    setUnreadCount(0);
  };

  const quickSwitchUser = async (type: 'customer' | 'provider' | 'admin') => {
    if (type === 'customer') {
      await login('customer@servicehub.in', 'Customer@123');
    } else if (type === 'provider') {
      await login('rameshwar@kisanmitra.in', 'Pro@123');
    } else if (type === 'admin') {
      await login('admin@servicehub.in', 'Admin@123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        providerProfile,
        unreadCount,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        quickSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
