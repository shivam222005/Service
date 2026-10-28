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

const USER_CACHE_KEY = 'servicehub_cached_user';
const PROFILE_CACHE_KEY = 'servicehub_cached_profile';

function getCached<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (_e) {
    return null;
  }
}

function setCached(key: string, value: any): void {
  try {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  } catch (_e) {
    // Ignore iframe storage quotas
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getCached<User>(USER_CACHE_KEY));
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(() => getCached<ProviderProfile>(PROFILE_CACHE_KEY));
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setProviderProfile(null);
        setUnreadCount(0);
        setCached(USER_CACHE_KEY, null);
        setCached(PROFILE_CACHE_KEY, null);
        setIsLoading(false);
        return;
      }
      const data = await api.auth.me();
      setUser(data.user);
      setProviderProfile(data.providerProfile || null);
      setUnreadCount(data.unreadNotifications || 0);
      setCached(USER_CACHE_KEY, data.user);
      setCached(PROFILE_CACHE_KEY, data.providerProfile || null);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      api.auth.logout();
      setUser(null);
      setProviderProfile(null);
      setCached(USER_CACHE_KEY, null);
      setCached(PROFILE_CACHE_KEY, null);
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
    setCached(USER_CACHE_KEY, null);
    setCached(PROFILE_CACHE_KEY, null);
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
