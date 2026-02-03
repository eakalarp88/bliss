'use client';

import { create } from 'zustand';
import { supabase, type DbService, type DbBooking, type DbBookingService, type DbStaff, type DbStaffSchedule } from './supabase';

// Frontend types (mapped from DB)
export interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  salaryBase: number;
  commissionEnabled: boolean;
  isActive: boolean;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  date: string;
  isDayOff: boolean;
  note: string | null;
}

// Map DB staff to frontend staff
const mapDbStaff = (db: DbStaff): Staff => ({
  id: db.id,
  name: db.name,
  phone: db.phone,
  email: db.email,
  role: db.role,
  salaryBase: db.salary_base,
  commissionEnabled: db.commission_enabled,
  isActive: db.is_active,
});

// Map DB staff schedule to frontend
const mapDbStaffSchedule = (db: DbStaffSchedule): StaffSchedule => ({
  id: db.id,
  staffId: db.staff_id,
  date: db.date,
  isDayOff: db.is_day_off,
  note: db.note,
});

export interface Service {
  id: string;
  name: string;
  zone: 'hair' | 'nail';
  duration: number;
  availableFrom: string;
  availableTo: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Booking {
  id: string;
  services: Service[];
  totalDuration: number;
  zone: 'hair' | 'nail';
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  slipImage?: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  channel: 'web' | 'walk-in' | 'line';
  createdAt: string;
}

// Map DB service to frontend service
const mapDbService = (db: DbService): Service => ({
  id: db.id,
  name: db.name,
  zone: db.zone,
  duration: db.duration,
  availableFrom: db.available_from,
  availableTo: db.available_to,
  isActive: db.is_active,
  sortOrder: db.sort_order,
});

// Map DB booking to frontend booking
const mapDbBooking = (db: DbBooking, services: Service[]): Booking => ({
  id: db.id,
  services,
  totalDuration: db.total_duration,
  zone: db.zone,
  date: db.date,
  time: db.time,
  customerName: db.customer_name,
  customerPhone: db.customer_phone,
  notes: db.notes || undefined,
  slipImage: db.slip_image || undefined,
  status: db.status,
  channel: db.channel,
  createdAt: db.created_at,
});

// Store interface
interface BookingStore {
  services: Service[];
  bookings: Booking[];
  staff: Staff[];
  staffSchedules: StaffSchedule[];
  isLoading: boolean;
  error: string | null;

  // Fetch data
  fetchServices: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchStaffSchedules: () => Promise<void>;

  // Service actions
  addService: (service: Omit<Service, 'id'>) => Promise<string | null>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  toggleServiceActive: (id: string) => Promise<void>;
  reorderServices: (zone: 'hair' | 'nail', orderedIds: string[]) => Promise<void>;

  // Booking actions
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<string | null>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  completeBooking: (id: string) => Promise<void>;
  getBookingById: (id: string) => Booking | undefined;
  getActiveServices: () => Service[];

  // Staff schedule actions
  addStaffDayOff: (staffId: string, date: string, note?: string) => Promise<void>;
  removeStaffDayOff: (staffId: string, date: string) => Promise<void>;
  getZoneCapacity: (zone: 'hair' | 'nail', date: string) => number;
  getStaffDaysOff: (staffId: string) => string[];
}

// Generate unique ID
const generateId = () => `BK${Date.now().toString(36).toUpperCase()}`;

export const useBookingStore = create<BookingStore>((set, get) => ({
  services: [],
  bookings: [],
  staff: [],
  staffSchedules: [],
  isLoading: false,
  error: null,

  fetchStaff: async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at');

      if (error) throw error;

      const staff = (data as DbStaff[]).map(mapDbStaff);
      set({ staff });
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      set({ error: error.message });
    }
  },

  fetchStaffSchedules: async () => {
    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*');

      if (error) throw error;

      const staffSchedules = (data as DbStaffSchedule[]).map(mapDbStaffSchedule);
      set({ staffSchedules });
    } catch (error: any) {
      console.error('Error fetching staff schedules:', error);
      set({ error: error.message });
    }
  },

  fetchServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      const services = (data as DbService[]).map(mapDbService);
      set({ services, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching services:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch booking services
      const { data: bookingServicesData, error: bsError } = await supabase
        .from('booking_services')
        .select('*');

      if (bsError) throw bsError;

      // Map bookings with their services
      const bookings = (bookingsData as DbBooking[]).map((db) => {
        const bookingServices = (bookingServicesData as DbBookingService[])
          .filter((bs) => bs.booking_id === db.id)
          .map((bs) => ({
            id: bs.service_id || bs.id,
            name: bs.service_name,
            zone: db.zone,
            duration: bs.service_duration,
            availableFrom: '09:00',
            availableTo: '20:00',
            isActive: true,
            sortOrder: 1,
          }));

        return mapDbBooking(db, bookingServices);
      });

      set({ bookings, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addService: async (serviceData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: serviceData.name,
          zone: serviceData.zone,
          duration: serviceData.duration,
          available_from: serviceData.availableFrom,
          available_to: serviceData.availableTo,
          is_active: serviceData.isActive,
          sort_order: serviceData.sortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newService = mapDbService(data as DbService);
      set((state) => ({ services: [...state.services, newService] }));
      return newService.id;
    } catch (error: any) {
      console.error('Error adding service:', error);
      set({ error: error.message });
      return null;
    }
  },

  updateService: async (id, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.zone !== undefined) dbUpdates.zone = updates.zone;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.availableFrom !== undefined) dbUpdates.available_from = updates.availableFrom;
      if (updates.availableTo !== undefined) dbUpdates.available_to = updates.availableTo;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      const { error } = await supabase
        .from('services')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        services: state.services.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    } catch (error: any) {
      console.error('Error updating service:', error);
      set({ error: error.message });
    }
  },

  toggleServiceActive: async (id) => {
    const service = get().services.find((s) => s.id === id);
    if (!service) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.isActive })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        services: state.services.map((s) =>
          s.id === id ? { ...s, isActive: !s.isActive } : s
        ),
      }));
    } catch (error: any) {
      console.error('Error toggling service:', error);
      set({ error: error.message });
    }
  },

  reorderServices: async (zone, orderedIds) => {
    try {
      // Update each service's sort order
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('services')
          .update({ sort_order: index + 1 })
          .eq('id', id)
      );

      await Promise.all(updates);

      set((state) => ({
        services: state.services.map((s) => {
          if (s.zone === zone) {
            const newOrder = orderedIds.indexOf(s.id);
            return { ...s, sortOrder: newOrder >= 0 ? newOrder + 1 : s.sortOrder };
          }
          return s;
        }),
      }));
    } catch (error: any) {
      console.error('Error reordering services:', error);
      set({ error: error.message });
    }
  },

  addBooking: async (bookingData) => {
    try {
      const id = generateId();

      // Insert booking
      const { error: bookingError } = await supabase.from('bookings').insert({
        id,
        zone: bookingData.zone,
        date: bookingData.date,
        time: bookingData.time,
        customer_name: bookingData.customerName,
        customer_phone: bookingData.customerPhone,
        notes: bookingData.notes || null,
        slip_image: bookingData.slipImage || null,
        status: bookingData.status,
        channel: bookingData.channel,
        total_duration: bookingData.totalDuration,
      });

      if (bookingError) throw bookingError;

      // Insert booking services
      const bookingServices = bookingData.services.map((s) => ({
        booking_id: id,
        service_id: s.id,
        service_name: s.name,
        service_duration: s.duration,
      }));

      const { error: bsError } = await supabase
        .from('booking_services')
        .insert(bookingServices);

      if (bsError) throw bsError;

      const newBooking: Booking = {
        ...bookingData,
        id,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ bookings: [newBooking, ...state.bookings] }));
      return id;
    } catch (error: any) {
      console.error('Error adding booking:', error);
      set({ error: error.message });
      return null;
    }
  },

  updateBooking: async (id, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }));
    } catch (error: any) {
      console.error('Error updating booking:', error);
      set({ error: error.message });
    }
  },

  cancelBooking: async (id) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' } : b
        ),
      }));
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      set({ error: error.message });
    }
  },

  completeBooking: async (id) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'completed' } : b
        ),
      }));
    } catch (error: any) {
      console.error('Error completing booking:', error);
      set({ error: error.message });
    }
  },

  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },

  getActiveServices: () => {
    return get().services.filter((s) => s.isActive);
  },

  addStaffDayOff: async (staffId, date, note) => {
    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .insert({
          staff_id: staffId,
          date,
          is_day_off: true,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newSchedule = mapDbStaffSchedule(data as DbStaffSchedule);
      set((state) => ({
        staffSchedules: [...state.staffSchedules, newSchedule],
      }));
    } catch (error: any) {
      console.error('Error adding staff day off:', error);
      set({ error: error.message });
    }
  },

  removeStaffDayOff: async (staffId, date) => {
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('staff_id', staffId)
        .eq('date', date);

      if (error) throw error;

      set((state) => ({
        staffSchedules: state.staffSchedules.filter(
          (s) => !(s.staffId === staffId && s.date === date)
        ),
      }));
    } catch (error: any) {
      console.error('Error removing staff day off:', error);
      set({ error: error.message });
    }
  },

  getZoneCapacity: (zone, date) => {
    const { staff, staffSchedules } = get();
    
    // Get active staff in this zone
    const zoneStaff = staff.filter(
      (s) => s.isActive && s.role === zone
    );
    
    // Get staff who have day off on this date
    const staffOnDayOff = staffSchedules
      .filter((s) => s.date === date && s.isDayOff)
      .map((s) => s.staffId);
    
    // Count available staff
    const availableStaff = zoneStaff.filter(
      (s) => !staffOnDayOff.includes(s.id)
    );
    
    return availableStaff.length;
  },

  getStaffDaysOff: (staffId) => {
    return get().staffSchedules
      .filter((s) => s.staffId === staffId && s.isDayOff)
      .map((s) => s.date);
  },
}));

// Helper functions for time slot availability
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Default capacity when no staff data available
const DEFAULT_ZONE_CAPACITY: Record<'hair' | 'nail', number> = {
  hair: 1,
  nail: 2,
};

export function isTimeSlotAvailable(
  bookings: Booking[],
  date: string,
  time: string,
  zone: 'hair' | 'nail',
  serviceDuration: number,
  capacity?: number
): boolean {
  // Use provided capacity or default
  const zoneCapacity = capacity ?? DEFAULT_ZONE_CAPACITY[zone];
  
  // If no staff available, slot is not available
  if (zoneCapacity <= 0) return false;
  
  const activeBookings = bookings.filter(
    (b) => b.date === date && b.zone === zone && b.status !== 'cancelled'
  );

  const newStartMinutes = timeToMinutes(time);
  const newEndMinutes = newStartMinutes + serviceDuration;

  let overlappingCount = 0;

  for (const booking of activeBookings) {
    const bookingStartMinutes = timeToMinutes(booking.time);
    const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;
    const hasOverlap = newStartMinutes < bookingEndMinutes && newEndMinutes > bookingStartMinutes;

    if (hasOverlap) {
      overlappingCount++;
    }
  }

  return overlappingCount < zoneCapacity;
}

export function getUnavailableTimes(
  bookings: Booking[],
  date: string,
  zone: 'hair' | 'nail',
  serviceDuration: number = 30,
  slotInterval: number = 30,
  capacity?: number
): string[] {
  // Use provided capacity or default
  const zoneCapacity = capacity ?? DEFAULT_ZONE_CAPACITY[zone];
  
  const activeBookings = bookings.filter(
    (b) => b.date === date && b.zone === zone && b.status !== 'cancelled'
  );

  const allSlots: string[] = [];
  for (let m = 8 * 60; m < 22 * 60; m += slotInterval) {
    allSlots.push(minutesToTime(m));
  }

  // If no staff available, all slots are unavailable
  if (zoneCapacity <= 0) return allSlots;

  const unavailableSlots: string[] = [];

  for (const slot of allSlots) {
    const slotStartMinutes = timeToMinutes(slot);
    const slotEndMinutes = slotStartMinutes + serviceDuration;

    let overlappingCount = 0;

    for (const booking of activeBookings) {
      const bookingStartMinutes = timeToMinutes(booking.time);
      const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;
      const hasOverlap = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;

      if (hasOverlap) {
        overlappingCount++;
      }
    }

    if (overlappingCount >= zoneCapacity) {
      unavailableSlots.push(slot);
    }
  }

  return unavailableSlots;
}
