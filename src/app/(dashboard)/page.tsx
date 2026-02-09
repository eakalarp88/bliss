'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  ChevronRight,
  Scissors,
  Sparkles,
  Plus,
  Clock,
  List,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { getZoneIcon, formatLocalDate } from '@/lib/utils';
import { useBookingStore, type Booking, type Service } from '@/lib/store';

// Helper to get services array (supports old and new format)
const getBookingServices = (booking: Booking): Service[] => {
  if (booking.services && Array.isArray(booking.services)) {
    return booking.services;
  }
  const legacyBooking = booking as any;
  if (legacyBooking.service) {
    return [legacyBooking.service];
  }
  return [];
};

// Helper to get total duration
const getBookingDuration = (booking: Booking): number => {
  if (booking.totalDuration) return booking.totalDuration;
  const services = getBookingServices(booking);
  return services.reduce((sum, s) => sum + (s.duration || 0), 0);
};

// Time slots for timeline (9:00 - 21:00)
const timelineHours = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 9;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export default function HomePage() {
  const { bookings, isLoading, fetchBookings } = useBookingStore();
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  const today = new Date();
  const todayStr = formatLocalDate(today);
  
  const thaiDate = today.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const todayBookings = bookings.filter(b => b.date === todayStr);
    const confirmed = todayBookings.filter(b => b.status === 'confirmed');
    const completed = todayBookings.filter(b => b.status === 'completed');
    const hairBookings = todayBookings.filter(b => b.zone === 'hair');
    const nailBookings = todayBookings.filter(b => b.zone === 'nail');
    
    return {
      totalBookings: todayBookings.length,
      confirmedCount: confirmed.length,
      completedCount: completed.length,
      hairCount: hairBookings.length,
      nailCount: nailBookings.length,
    };
  }, [bookings, todayStr]);

  // All bookings for today (sorted by time)
  const todayBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === todayStr && b.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, todayStr]);

  // Separate bookings by zone for timeline
  const hairBookings = todayBookings.filter(b => b.zone === 'hair');
  const nailBookings = todayBookings.filter(b => b.zone === 'nail');

  // Helper to check if a booking falls within a time slot
  const getBookingsAtHour = (bookingsList: Booking[], hour: string) => {
    const hourNum = parseInt(hour.split(':')[0]);
    return bookingsList.filter(b => {
      const bookingHour = parseInt(b.time.split(':')[0]);
      const duration = getBookingDuration(b);
      const endHour = bookingHour + Math.ceil(duration / 60);
      return bookingHour <= hourNum && hourNum < endHour;
    });
  };

  // Get booking that starts at this hour
  const getBookingStartingAt = (bookingsList: Booking[], hour: string) => {
    return bookingsList.find(b => b.time.startsWith(hour.split(':')[0] + ':'));
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-100 to-beige-100 rounded-2xl p-5">
        <p className="text-muted-foreground text-sm">สวัสดีค่ะ 👋</p>
        <h2 className="text-2xl font-bold mt-1">Bliss Salon</h2>
        <p className="text-muted-foreground mt-2">{thaiDate}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">โซนผม</p>
              <p className="text-xl font-bold">{todayStats.hairCount} คิว</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-beige-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-beige-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-beige-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">โซนเล็บ</p>
              <p className="text-xl font-bold">{todayStats.nailCount} คิว</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📋 คิววันนี้</h3>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-beige-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-beige-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-beige-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Link 
              href="/bookings" 
              className="text-primary font-medium flex items-center gap-1"
            >
              จัดการ
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {todayBookings.length === 0 ? (
          <Card className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">ยังไม่มีคิววันนี้</p>
            <Link href="/bookings/new" className="inline-block mt-4">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                เพิ่มนัดหมาย
              </Button>
            </Link>
          </Card>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-2">
            {todayBookings.map((booking) => {
              const isCompleted = booking.status === 'completed';
              const services = getBookingServices(booking);
              const duration = getBookingDuration(booking);
              return (
                <Card 
                  key={booking.id}
                  className={`flex items-center gap-3 ${isCompleted ? 'opacity-60 bg-green-50' : ''}`}
                  padding="sm"
                >
                  {/* Time */}
                  <div className="text-center min-w-[50px]">
                    <p className={`text-lg font-bold ${isCompleted ? 'text-green-600' : 'text-primary'}`}>
                      {booking.time}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className={`w-px h-10 ${isCompleted ? 'bg-green-200' : 'bg-border'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{getZoneIcon(booking.zone)}</span>
                      <p className={`font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {services.length === 1 
                          ? services[0]?.name || 'ไม่ระบุ'
                          : `${services.length} บริการ`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {booking.customerName} • {duration} นาที
                    </p>
                  </div>

                  {/* Status */}
                  {isCompleted ? (
                    <Badge variant="success" size="sm">✓</Badge>
                  ) : (
                    <Badge variant={booking.zone === 'hair' ? 'hair' : 'nail'} size="sm">
                      รอ
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          /* Timeline View */
          <Card padding="sm" className="overflow-x-auto">
            <div className="min-w-[300px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_1fr_1fr] gap-2 mb-2 sticky top-0 bg-white pb-2 border-b">
                <div className="text-xs text-muted-foreground font-medium">เวลา</div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-pink-600">
                    <Scissors className="w-4 h-4" />
                    ผม
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-amber-600">
                    <Sparkles className="w-4 h-4" />
                    เล็บ
                  </div>
                </div>
              </div>

              {/* Timeline Rows */}
              <div className="space-y-1">
                {timelineHours.map((hour) => {
                  const hairBooking = getBookingStartingAt(hairBookings, hour);
                  const nailBooking = getBookingStartingAt(nailBookings, hour);
                  const hairOccupied = getBookingsAtHour(hairBookings, hour);
                  const nailOccupied = getBookingsAtHour(nailBookings, hour);
                  
                  return (
                    <div 
                      key={hour} 
                      className="grid grid-cols-[60px_1fr_1fr] gap-2 min-h-[44px]"
                    >
                      {/* Time Label */}
                      <div className="text-sm text-muted-foreground font-mono flex items-start pt-1">
                        {hour}
                      </div>

                      {/* Hair Zone */}
                      <div className="relative">
                        {hairBooking ? (
                          <div 
                            className={`rounded-lg p-2 text-xs ${
                              hairBooking.status === 'completed'
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-pink-100 border border-pink-300'
                            }`}
                            style={{
                              minHeight: `${Math.max(44, getBookingDuration(hairBooking) * 0.7)}px`
                            }}
                          >
                            <p className="font-medium truncate">
                              {getBookingServices(hairBooking)[0]?.name || 'บริการ'}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {hairBooking.customerName}
                            </p>
                            <p className="text-muted-foreground">
                              {hairBooking.time} • {getBookingDuration(hairBooking)}น.
                            </p>
                          </div>
                        ) : hairOccupied.length > 0 ? (
                          <div className="h-full rounded-lg bg-pink-50 border border-pink-200 border-dashed" />
                        ) : (
                          <div className="h-full rounded-lg bg-gray-50 border border-gray-200 border-dashed opacity-50" />
                        )}
                      </div>

                      {/* Nail Zone */}
                      <div className="relative">
                        {nailBooking ? (
                          <div 
                            className={`rounded-lg p-2 text-xs ${
                              nailBooking.status === 'completed'
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-amber-100 border border-amber-300'
                            }`}
                            style={{
                              minHeight: `${Math.max(44, getBookingDuration(nailBooking) * 0.7)}px`
                            }}
                          >
                            <p className="font-medium truncate">
                              {getBookingServices(nailBooking).length === 1
                                ? getBookingServices(nailBooking)[0]?.name
                                : `${getBookingServices(nailBooking).length} บริการ`}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {nailBooking.customerName}
                            </p>
                            <p className="text-muted-foreground">
                              {nailBooking.time} • {getBookingDuration(nailBooking)}น.
                            </p>
                          </div>
                        ) : nailOccupied.length > 0 ? (
                          <div className="h-full rounded-lg bg-amber-50 border border-amber-200 border-dashed" />
                        ) : (
                          <div className="h-full rounded-lg bg-gray-50 border border-gray-200 border-dashed opacity-50" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/bookings/new">
          <Button variant="primary" className="w-full h-14">
            <Plus className="w-5 h-5" />
            เพิ่มนัดหมาย
          </Button>
        </Link>
        <Link href="/bookings">
          <Button variant="secondary" className="w-full h-14">
            <Calendar className="w-5 h-5" />
            ดูตาราง
          </Button>
        </Link>
      </div>
    </div>
  );
}
