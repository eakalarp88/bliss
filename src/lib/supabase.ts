import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbService {
  id: string;
  name: string;
  zone: 'hair' | 'nail';
  duration: number;
  available_from: string;
  available_to: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbBooking {
  id: string;
  zone: 'hair' | 'nail';
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  slip_image: string | null;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  channel: 'web' | 'walk-in' | 'line';
  total_duration: number;
  created_at: string;
}

export interface DbBookingService {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  service_duration: number;
}
