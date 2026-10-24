export type UserRole = 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ServiceMode = 'ON_SITE' | 'AT_SHOP' | 'REMOTE' | 'TRAVEL';

export type BookingStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface ProviderProfile {
  user_id: number;
  business_name: string;
  bio: string;
  experience_years: number;
  hourly_rate: number;
  service_area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  service_modes: string[];
  languages: string[];
  verification_status: VerificationStatus;
  verified_badge: number; // 1 or 0
  aadhaar_verified: number; // 1 or 0
  trade_license_no?: string;
  skills: string[];
  rating_avg?: number;
  reviews_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  image_url: string;
  sector: 'HOME' | 'AGRI_RURAL' | 'ELECTRONICS' | 'COMMUNITY';
  services_count?: number;
}

export interface ServiceListing {
  id: number;
  provider_id: number;
  category_id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  pricing_unit: string; // 'fixed', 'per hour', 'per visit', 'per acre / bigha', 'per sq ft'
  duration_minutes: number;
  image_url?: string;
  service_mode: ServiceMode;
  status: 'ACTIVE' | 'PAUSED';
  service_area: string;
  pincodes_covered?: string;
  created_at: string;
  // joined fields:
  provider_name?: string;
  provider_business?: string;
  provider_avatar?: string;
  provider_verified?: number;
  provider_aadhaar_verified?: number;
  provider_experience?: number;
  provider_city?: string;
  provider_district?: string;
  provider_state?: string;
  category_name?: string;
  category_slug?: string;
  category_sector?: string;
  rating_avg?: number;
  reviews_count?: number;
}

export interface Booking {
  id: number;
  service_id: number;
  customer_id: number;
  provider_id: number;
  booking_date: string;
  time_slot: string;
  address: string;
  pincode?: string;
  district?: string;
  service_mode: ServiceMode;
  notes?: string;
  status: BookingStatus;
  total_price: number;
  payment_method: string;
  payment_status: 'PENDING' | 'PAID';
  created_at: string;
  updated_at: string;
  // joined fields:
  service_title?: string;
  service_image?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  provider_name?: string;
  provider_business?: string;
  provider_phone?: string;
  has_reviewed?: boolean;
}

export interface Review {
  id: number;
  booking_id: number;
  service_id: number;
  customer_id: number;
  provider_id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer_name?: string;
  customer_avatar?: string;
  service_title?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_ACCEPTED' | 'BOOKING_CANCELLED' | 'BOOKING_COMPLETED' | 'REVIEW_RECEIVED' | 'SYSTEM';
  link?: string;
  is_read: number;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  pendingProviders: number;
  totalBookings: number;
  completedBookings: number;
  totalVolume: number;
  totalReviews: number;
  avgRating: number;
}

export type EmergencyIncidentType = 
  | 'LPG_LEAK' 
  | 'ELECTRICAL_HAZARD' 
  | 'WATER_LEAK' 
  | 'FIRE_SMOKE' 
  | 'OTHER_URGENT';

export type EmergencyStatus = 
  | 'OPEN' 
  | 'ACCEPTED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CANCELLED';

export interface EmergencyRequest {
  id: number;
  incident_type: EmergencyIncidentType;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  title: string;
  description: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  address: string;
  district: string;
  pincode?: string;
  status: EmergencyStatus;
  assigned_provider_id?: number | null;
  assigned_provider_name?: string;
  assigned_provider_phone?: string;
  assigned_provider_business?: string;
  notes?: string;
  created_at: string;
  accepted_at?: string;
  resolved_at?: string;
  updated_at?: string;
}

