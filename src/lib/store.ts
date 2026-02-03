'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Service {
  id: string;
  name: string;
  zone: 'hair' | 'nail';
  duration: number; // in minutes
  availableFrom: string; // HH:mm - start time for booking
  availableTo: string; // HH:mm - end time for booking
  isActive: boolean; // whether the service is active
  sortOrder: number; // display order
}

export interface Booking {
  id: string;
  services: Service[]; // Multiple services in one booking
  totalDuration: number; // Total duration of all services
  zone: 'hair' | 'nail';
  date: string; // ISO date string
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
  notes?: string;
  slipImage?: string; // Base64 or URL of payment slip (for nail zone)
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  channel: 'web' | 'walk-in' | 'line';
  createdAt: string;
}

// Default services (with available time range)
// โซนผม: 09:00 - 19:00 | โซนเล็บ: 10:00 - 20:00
export const defaultServices: Service[] = [
  // Hair services (09:00 - 19:00)
  { id: '1', name: 'ตัดผม', zone: 'hair', duration: 30, availableFrom: '09:00', availableTo: '19:00', isActive: true, sortOrder: 1 },
  { id: '2', name: 'สระ + ไดร์', zone: 'hair', duration: 45, availableFrom: '09:00', availableTo: '19:00', isActive: true, sortOrder: 2 },
  { id: '3', name: 'ทำสีผม', zone: 'hair', duration: 120, availableFrom: '09:00', availableTo: '17:00', isActive: true, sortOrder: 3 },
  { id: '4', name: 'ดัดผม', zone: 'hair', duration: 180, availableFrom: '09:00', availableTo: '16:00', isActive: true, sortOrder: 4 },
  { id: '5', name: 'ยืดผม', zone: 'hair', duration: 150, availableFrom: '09:00', availableTo: '16:30', isActive: false, sortOrder: 5 },
  { id: '6', name: 'ทรีทเม้นท์', zone: 'hair', duration: 45, availableFrom: '09:00', availableTo: '19:00', isActive: true, sortOrder: 6 },
  // Nail services (10:00 - 20:00)
  { id: '7', name: 'ทำเล็บเจล', zone: 'nail', duration: 60, availableFrom: '10:00', availableTo: '20:00', isActive: true, sortOrder: 1 },
  { id: '8', name: 'ทำเล็บสีธรรมดา', zone: 'nail', duration: 45, availableFrom: '10:00', availableTo: '20:00', isActive: true, sortOrder: 2 },
  { id: '9', name: 'ต่อเล็บ', zone: 'nail', duration: 90, availableFrom: '10:00', availableTo: '18:30', isActive: true, sortOrder: 3 },
  { id: '10', name: 'สปามือ', zone: 'nail', duration: 45, availableFrom: '10:00', availableTo: '20:00', isActive: true, sortOrder: 4 },
  { id: '11', name: 'สปาเท้า', zone: 'nail', duration: 60, availableFrom: '10:00', availableTo: '20:00', isActive: true, sortOrder: 5 },
  { id: '12', name: 'ทำเล็บเท้า', zone: 'nail', duration: 45, availableFrom: '10:00', availableTo: '20:00', isActive: true, sortOrder: 6 },
];

// Store interface
interface BookingStore {
  bookings: Booking[];
  services: Service[];
  
  // Booking Actions
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => string;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  getBookingsByDate: (date: string) => Booking[];
  getBookingById: (id: string) => Booking | undefined;
  
  // Service Actions
  addService: (service: Omit<Service, 'id'>) => string;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  reorderServices: (zone: 'hair' | 'nail', orderedIds: string[]) => void;
  getActiveServices: () => Service[];
}

// Generate unique ID
const generateId = () => `BK${Date.now().toString(36).toUpperCase()}`;

// Create store with persistence
export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      services: defaultServices,

      addBooking: (bookingData) => {
        const id = generateId();
        const newBooking: Booking = {
          ...bookingData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));
        return id;
      },

      updateBooking: (id, updates) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        }));
      },

      completeBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'completed' } : b
          ),
        }));
      },

      getBookingsByDate: (date) => {
        return get().bookings.filter(
          (b) => b.date === date && b.status !== 'cancelled'
        );
      },

      getBookingById: (id) => {
        return get().bookings.find((b) => b.id === id);
      },

      // Service Actions
      addService: (serviceData) => {
        const id = `SV${Date.now().toString(36).toUpperCase()}`;
        const newService: Service = {
          ...serviceData,
          id,
        };
        set((state) => ({
          services: [...state.services, newService],
        }));
        return id;
      },

      updateService: (id, updates) => {
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteService: (id) => {
        set((state) => ({
          services: state.services.filter((s) => s.id !== id),
        }));
      },

      toggleServiceActive: (id) => {
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
          ),
        }));
      },

      reorderServices: (zone, orderedIds) => {
        set((state) => ({
          services: state.services.map((s) => {
            if (s.zone === zone) {
              const newOrder = orderedIds.indexOf(s.id);
              return { ...s, sortOrder: newOrder >= 0 ? newOrder + 1 : s.sortOrder };
            }
            return s;
          }),
        }));
      },

      getActiveServices: () => {
        return get().services.filter((s) => s.isActive);
      },
    }),
    {
      name: 'bliss-bookings',
    }
  )
);

// Convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get all time slots blocked by a booking (based on total duration)
function getBlockedTimeSlots(booking: Booking, slotInterval: number = 30): string[] {
  const startMinutes = timeToMinutes(booking.time);
  const duration = booking.totalDuration;
  const slots: string[] = [];
  
  // Block all slots from start time to end of service
  for (let m = startMinutes; m < startMinutes + duration; m += slotInterval) {
    slots.push(minutesToTime(m));
  }
  
  return slots;
}

// Zone capacity (how many concurrent bookings)
const ZONE_CAPACITY: Record<'hair' | 'nail', number> = {
  hair: 1, // 1 staff = 1 concurrent booking
  nail: 2, // 2 staff = 2 concurrent bookings
};

// Helper to check if time slot is available (considering duration and capacity)
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
  
  // Count how many bookings overlap with the requested time range
  let overlappingCount = 0;
  
  for (const booking of activeBookings) {
    const bookingStartMinutes = timeToMinutes(booking.time);
    const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;
    
    // Check if there's any overlap
    const hasOverlap = newStartMinutes < bookingEndMinutes && newEndMinutes > bookingStartMinutes;
    
    if (hasOverlap) {
      overlappingCount++;
    }
  }
  
  return overlappingCount < capacity;
}

// Helper to get unavailable times for a date, zone, and service duration
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
  
  // Generate all possible time slots (8:00 - 22:00)
  const allSlots: string[] = [];
  for (let m = 8 * 60; m < 22 * 60; m += slotInterval) {
    allSlots.push(minutesToTime(m));
  }
  
  // Check each slot
  const unavailableSlots: string[] = [];
  
  for (const slot of allSlots) {
    const slotStartMinutes = timeToMinutes(slot);
    const slotEndMinutes = slotStartMinutes + serviceDuration;
    
    // Count overlapping bookings for this time slot
    let overlappingCount = 0;
    
    for (const booking of activeBookings) {
      const bookingStartMinutes = timeToMinutes(booking.time);
      const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;
      
      // Check if the new service would overlap with existing booking
      const hasOverlap = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;
      
      if (hasOverlap) {
        overlappingCount++;
      }
    }
    
    // If at capacity, mark as unavailable
    if (overlappingCount >= capacity) {
      unavailableSlots.push(slot);
    }
  }
  
  return unavailableSlots;
}
