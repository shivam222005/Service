import { 
  User, 
  ProviderProfile, 
  Category, 
  ServiceListing, 
  Booking, 
  Review, 
  NotificationItem, 
  AdminStats, 
  BookingStatus,
  BookingStatusHistory,
  AIAnalysisResponse,
  AdminAnalyticsData,
  EmergencyRequest,
  EmergencyIncidentType,
  EmergencyStatus,
  PaymentRecord,
  BillBreakdown,
  PaymentReceipt
} from '../types.js';

const TOKEN_KEY = 'servicehub_auth_token';
let inMemoryToken: string | null = null;

export function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_URL) {
      return String(import.meta.env.VITE_API_URL).replace(/\/+$/, '');
    }
    if (import.meta.env.VITE_API_BASE_URL) {
      return String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '');
    }
  }
  return '';
}

export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token || inMemoryToken;
  } catch (_e) {
    return inMemoryToken;
  }
}

export function setStoredToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (_e) {
    // Graceful fallback for restricted iframe storage
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      return res;
    },

    register: async (data: any): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setStoredToken(res.token);
      return res;
    },

    me: async (): Promise<{ user: User; providerProfile?: ProviderProfile; unreadNotifications: number }> => {
      return request('/api/auth/me');
    },

    updateProfile: async (data: any): Promise<{ user: User }> => {
      return request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    logout: () => {
      setStoredToken(null);
    },
  },

  categories: {
    getAll: async (): Promise<Category[]> => {
      return request('/api/categories');
    },
    create: async (data: Partial<Category>): Promise<{ id: number }> => {
      return request('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  services: {
    getAll: async (params: Record<string, any> = {}): Promise<ServiceListing[]> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, String(val));
        }
      });
      const qs = query.toString();
      return request(`/api/services${qs ? '?' + qs : ''}`);
    },

    getById: async (id: number | string): Promise<{ service: ServiceListing; reviews: Review[] }> => {
      return request(`/api/services/${id}`);
    },

    create: async (data: Partial<ServiceListing>): Promise<{ id: number }> => {
      return request('/api/services', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<ServiceListing>): Promise<{ message: string }> => {
      return request(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<{ message: string }> => {
      return request(`/api/services/${id}`, {
        method: 'DELETE',
      });
    },
  },

  providers: {
    getAll: async (): Promise<ProviderProfile[]> => {
      return request('/api/providers');
    },
    getById: async (id: number | string): Promise<{ provider: ProviderProfile; services: ServiceListing[]; reviews: Review[] }> => {
      return request(`/api/providers/${id}`);
    },
  },

  bookings: {
    getAll: async (): Promise<Booking[]> => {
      return request('/api/bookings');
    },

    create: async (data: {
      service_id: number;
      booking_date: string;
      time_slot: string;
      address: string;
      notes?: string;
      payment_method: string;
    }): Promise<{ id: number; message: string }> => {
      return request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateStatus: async (id: number, status: BookingStatus, notes?: string): Promise<{ message: string }> => {
      return request(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },

    getTimeline: async (id: number): Promise<{ success: boolean; timeline: BookingStatusHistory[] }> => {
      return request(`/api/bookings/${id}/timeline`);
    },
  },

  payments: {
    completeService: async (bookingId: number): Promise<{ success: boolean; message: string; booking: Booking; payment: PaymentRecord; breakdown: BillBreakdown }> => {
      return request(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
      });
    },

    getPayment: async (bookingId: number): Promise<{ success: boolean; payment: PaymentRecord; breakdown: BillBreakdown; booking: any }> => {
      return request(`/api/bookings/${bookingId}/payment`);
    },

    verifyPayment: async (paymentOrBookingId: number | string, data: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; bank_reference?: string } = {}): Promise<{ success: boolean; verified: boolean; message: string; payment: PaymentRecord; booking: Booking; receipt: PaymentReceipt }> => {
      return request(`/api/payments/${paymentOrBookingId}/verify`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getReceipt: async (bookingId: number): Promise<{ success: boolean; receipt: PaymentReceipt }> => {
      return request(`/api/bookings/${bookingId}/receipt`);
    },
  },

  reviews: {
    create: async (data: { booking_id: number; rating: number; comment: string }): Promise<{ message: string }> => {
      return request('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  notifications: {
    getAll: async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
      return request('/api/notifications');
    },
    markRead: async (id: number): Promise<{ success: boolean }> => {
      return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    markAllRead: async (): Promise<{ success: boolean }> => {
      return request('/api/notifications/read-all', { method: 'PATCH' });
    },
  },

  admin: {
    getStats: async (): Promise<AdminStats> => {
      return request('/api/admin/stats');
    },
    getUsers: async (): Promise<any[]> => {
      return request('/api/admin/users');
    },
    getProviders: async (): Promise<any[]> => {
      return request('/api/admin/providers');
    },
    verifyProvider: async (id: number, status: 'APPROVED' | 'REJECTED'): Promise<{ message: string }> => {
      return request(`/api/admin/providers/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getServices: async (): Promise<any[]> => {
      return request('/api/admin/services');
    },
    deleteService: async (id: number): Promise<{ message: string }> => {
      return request(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
    },
    updateServiceStatus: async (id: number, status: 'ACTIVE' | 'PAUSED'): Promise<{ message: string }> => {
      return request(`/api/admin/services/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getBookings: async (): Promise<Booking[]> => {
      return request('/api/admin/bookings');
    },
    updateBookingStatus: async (id: number, status: BookingStatus): Promise<{ message: string }> => {
      return request(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    deleteReview: async (id: number): Promise<{ message: string }> => {
      return request(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
    },
    getAnalytics: async (range: string = '30d'): Promise<AdminAnalyticsData> => {
      return request(`/api/admin/analytics?range=${range}`);
    },
  },

  ai: {
    askAssistant: async (data: { query: string; city?: string; pincode?: string }): Promise<{ success: boolean; data: AIAnalysisResponse }> => {
      return request('/api/ai/assistant', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  emergency: {
    createRequest: async (data: {
      incident_type: EmergencyIncidentType;
      severity?: 'CRITICAL' | 'HIGH' | 'MODERATE';
      title?: string;
      description: string;
      customer_name: string;
      customer_phone: string;
      address: string;
      district: string;
      pincode?: string;
      notes?: string;
    }): Promise<{ message: string; emergency_request: EmergencyRequest }> => {
      return request('/api/emergency/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getAll: async (phone?: string): Promise<EmergencyRequest[]> => {
      return request(`/api/emergency/requests${phone ? '?phone=' + encodeURIComponent(phone) : ''}`);
    },

    getById: async (id: number): Promise<EmergencyRequest> => {
      return request(`/api/emergency/requests/${id}`);
    },

    accept: async (id: number): Promise<{ message: string; emergency_request: EmergencyRequest }> => {
      return request(`/api/emergency/requests/${id}/accept`, {
        method: 'POST',
      });
    },

    updateStatus: async (id: number, status: EmergencyStatus, notes?: string): Promise<{ message: string; emergency_request: EmergencyRequest }> => {
      return request(`/api/emergency/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
  },
};

