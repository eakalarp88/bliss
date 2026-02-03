// ==========================================
// BLISS - Type Definitions
// ==========================================

// Zone Types
export type Zone = 'hair' | 'nail';

// ==========================================
// MODULE 1: Services
// ==========================================
export interface Service {
  id: string;
  service_name: string;
  zone: Zone;
  default_duration: number | null; // in minutes
  default_price: number | null;
  is_deposit_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// MODULE 2: Bookings
// ==========================================
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type BookingChannel = 'web' | 'line' | 'walk-in';
export type DepositStatus = 'pending' | 'paid' | 'refunded' | 'not_required';

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  zone: Zone;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm (auto calculated)
  status: BookingStatus;
  channel: BookingChannel;
  deposit_amount: number;
  deposit_status: DepositStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  service?: Service;
}

// ==========================================
// MODULE 3: Payments
// ==========================================
export type PaymentType = 'deposit' | 'full';
export type PaymentMethod = 'cash' | 'transfer' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  // Relations
  booking?: Booking;
}

// ==========================================
// MODULE 4: Billing
// ==========================================
export interface Bill {
  id: string;
  booking_id: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  closed_by: string; // staff_id
  closed_at: string;
  created_at: string;
  // Relations
  booking?: Booking;
  items?: BillItem[];
  closed_by_staff?: Staff;
}

export interface BillItem {
  id: string;
  bill_id: string;
  service_id: string;
  staff_id: string;
  price: number;
  duration: number; // in minutes
  // Relations
  service?: Service;
  staff?: Staff;
}

// ==========================================
// MODULE 5: Staff
// ==========================================
export type StaffRole = 'owner' | 'manager' | 'reception' | 'hair' | 'nail';

export interface Staff {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: StaffRole;
  salary_base: number;
  commission_enabled: boolean;
  pin_code: string; // 4-digit PIN for quick login
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// MODULE 6: Commission Rules
// ==========================================
export type CommissionType = 'percentage' | 'fixed';

export interface CommissionRule {
  id: string;
  rule_name: string;
  service_id: string | null; // null = applies to all
  staff_role: StaffRole | null; // null = applies to all roles
  commission_type: CommissionType;
  value: number; // percentage or fixed amount
  condition: Record<string, unknown> | null; // JSON for future tier/incentive
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
}

// ==========================================
// MODULE 7: Staff Commissions
// ==========================================
export interface StaffCommission {
  id: string;
  staff_id: string;
  bill_id: string;
  amount: number;
  calculated_at: string;
  // Relations
  staff?: Staff;
  bill?: Bill;
}

// ==========================================
// MODULE 8: Customers (CRM)
// ==========================================
export interface Customer {
  id: string;
  name: string;
  phone: string;
  line_id: string | null;
  total_spent: number;
  booking_count: number;
  no_show_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// System Configuration
// ==========================================
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

// Default configs:
// - max_advance_booking_days: 30
// - min_cancel_hours: 24
// - max_reschedule_per_booking: 1
// - nail_deposit_amount: 100
// - hair_deposit_required: false

// ==========================================
// Dashboard Types
// ==========================================
export interface DashboardStats {
  todayRevenue: number;
  todayBookings: number;
  hairRevenue: number;
  nailRevenue: number;
  topStaff: {
    staff: Staff;
    revenue: number;
  }[];
  bookingUtilization: number; // percentage
  newCustomers: number;
  returningCustomers: number;
}

// ==========================================
// Form Types
// ==========================================
export interface BookingForm {
  customer_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  channel: BookingChannel;
  notes?: string;
}

export interface BillForm {
  booking_id: string;
  items: {
    service_id: string;
    staff_id: string;
    price: number;
    duration: number;
  }[];
  discount: number;
}

// ==========================================
// API Response Types
// ==========================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
