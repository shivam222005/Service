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
  EmergencyRequest,
  EmergencyIncidentType,
  EmergencyStatus
} from '../types.js';

const TOKEN_KEY = 'servicehub_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
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

  const response = await fetch(endpoint, {
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

    updateStatus: async (id: number, status: BookingStatus): Promise<{ message: string }> => {
      return request(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
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
    getProviders: async (): Promise<any[]> => {
      return request('/api/admin/providers');
    },
    verifyProvider: async (id: number, status: 'APPROVED' | 'REJECTED'): Promise<{ message: string }> => {
      return request(`/api/admin/providers/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getBookings: async (): Promise<Booking[]> => {
      return request('/api/admin/bookings');
    },
    deleteReview: async (id: number): Promise<{ message: string }> => {
      return request(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
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

