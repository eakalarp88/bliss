'use client';

import { create } from 'zustand';
import { supabase, type DbService, type DbBooking, type DbBookingService } from './supabase';

// Frontend types (mapped from DB)
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
  isLoading: boolean;
  error: string | null;

  // Fetch data
  fetchServices: () => Promise<void>;
  fetchBookings: () => Promise<void>;

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
}

// Generate unique ID
const generateId = () => `BK${Date.now().toString(36).toUpperCase()}`;

export const useBookingStore = create<BookingStore>((set, get) => ({
  services: [],
  bookings: [],
  isLoading: false,
  error: null,

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

const ZONE_CAPACITY: Record<'hair' | 'nail', number> = {
  hair: 1,
  nail: 2,
};

export function isTimeSlotAvailable(
  bookings: Booking[],
  date: string,
  time: string,
  zone: 'hair' | 'nail',
  serviceDuration: number
): boolean {
  const capacity = ZONE_CAPACITY[zone];
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

  return overlappingCount < capacity;
}

export function getUnavailableTimes(
  bookings: Booking[],
  date: string,
  zone: 'hair' | 'nail',
  serviceDuration: number = 30,
  slotInterval: number = 30
): string[] {
  const capacity = ZONE_CAPACITY[zone];
  const activeBookings = bookings.filter(
    (b) => b.date === date && b.zone === zone && b.status !== 'cancelled'
  );

  const allSlots: string[] = [];
  for (let m = 8 * 60; m < 22 * 60; m += slotInterval) {
    allSlots.push(minutesToTime(m));
  }

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

    if (overlappingCount >= capacity) {
      unavailableSlots.push(slot);
    }
  }

  return unavailableSlots;
}
