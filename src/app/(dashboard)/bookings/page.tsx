'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock
} from 'lucide-react';
import { Card, Badge, Button, Input, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { 
  getZoneIcon, 
  getStatusText, 
  getThaiDayName
} from '@/lib/utils';
import { useBookingStore, type Booking, type Service } from '@/lib/store';

// Helper to get services array (supports old and new format)
const getBookingServices = (booking: Booking): Service[] => {
  // New format: services array
  if (booking.services && Array.isArray(booking.services)) {
    return booking.services;
  }
  // Old format: single service - cast to any to handle legacy data
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

export default function BookingsPage() {
  const { bookings, completeBooking, cancelBooking, fetchBookings } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState<'all' | 'hair' | 'nail'>('all');

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Format date for comparison
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        // Filter by date
        if (booking.date !== selectedDateStr) return false;
        
        // Filter by search
        const matchesSearch = 
          booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.customerPhone.includes(searchQuery);
        
        // Filter by zone
        const matchesZone = filterZone === 'all' || booking.zone === filterZone;
        
        return matchesSearch && matchesZone;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, selectedDateStr, searchQuery, filterZone]);

  // Stats for selected date
  const dateStats = useMemo(() => {
    const dayBookings = bookings.filter(b => b.date === selectedDateStr);
    return {
      total: dayBookings.length,
      confirmed: dayBookings.filter(b => b.status === 'confirmed').length,
      completed: dayBookings.filter(b => b.status === 'completed').length,
      cancelled: dayBookings.filter(b => b.status === 'cancelled').length,
    };
  }, [bookings, selectedDateStr]);

  // Navigate dates
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Handle status updates
  const handleComplete = (id: string) => {
    completeBooking(id);
  };

  const handleCancel = (id: string) => {
    if (confirm('ต้องการยกเลิกนัดหมายนี้ใช่หรือไม่?')) {
      cancelBooking(id);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="ตารางนัดหมาย" 
        rightContent={
          <Link href="/bookings/new">
            <Button size="sm">
              <Plus className="w-5 h-5" />
              เพิ่ม
            </Button>
          </Link>
        }
      />

      {/* Date Navigation */}
      <Card className="flex items-center justify-between" padding="sm">
        <button 
          onClick={goToPreviousDay}
          className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <p className="text-lg font-semibold">
            {isToday ? 'วันนี้' : getThaiDayName(selectedDate)}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        
        <button 
          onClick={goToNextDay}
          className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-info">{dateStats.confirmed}</p>
          <p className="text-xs text-muted-foreground">รอ</p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-success">{dateStats.completed}</p>
          <p className="text-xs text-muted-foreground">เสร็จ</p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-2xl font-bold text-muted-foreground">{dateStats.total}</p>
          <p className="text-xs text-muted-foreground">ทั้งหมด</p>
        </Card>
      </div>

      {/* Quick Filter */}
      {!isToday && (
        <button 
          onClick={goToToday}
          className="text-primary font-medium text-sm"
        >
          กลับไปวันนี้
        </button>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาชื่อหรือเบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'ทั้งหมด' },
          { value: 'hair', label: '💇 ผม' },
          { value: 'nail', label: '💅 เล็บ' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterZone(tab.value as typeof filterZone)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filterZone === tab.value
                ? 'bg-primary text-white'
                : 'bg-beige-100 text-foreground hover:bg-beige-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-16 h-16" />}
          title="ไม่มีนัดหมาย"
          description={
            dateStats.total === 0
              ? "ยังไม่มีนัดหมายในวันที่เลือก"
              : "ไม่พบนัดหมายที่ตรงกับการค้นหา"
          }
          action={
            <Link href="/bookings/new">
              <Button>
                <Plus className="w-5 h-5" />
                เพิ่มนัดหมาย
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card 
              key={booking.id}
              className={`transition-opacity ${
                booking.status === 'cancelled' ? 'opacity-50' : ''
              }`}
              padding="md"
            >
              <div className="flex items-start gap-4">
                {/* Time */}
                <div className="text-center min-w-[70px]">
                  <p className="text-xl font-bold text-primary">
                    {booking.time}
                  </p>
                  <p className="text-xs text-muted-foreground">น.</p>
                </div>

                {/* Divider */}
                <div className="w-px h-16 bg-border" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {(() => {
                    const services = getBookingServices(booking);
                    const duration = getBookingDuration(booking);
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getZoneIcon(booking.zone)}</span>
                          <p className="font-semibold truncate">
                            {services.length === 1 
                              ? services[0]?.name || 'ไม่ระบุ'
                              : `${services.length} บริการ`}
                          </p>
                        </div>
                        {services.length > 1 && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {services.map(s => s.name).join(', ')}
                          </p>
                        )}
                        <p className="text-foreground font-medium">
                          {booking.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.customerPhone}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={
                              booking.status === 'completed' ? 'success' :
                              booking.status === 'cancelled' ? 'danger' :
                              booking.status === 'no-show' ? 'warning' : 'info'
                            }
                            size="sm"
                          >
                            {getStatusText(booking.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ⏱️ {duration} นาที
                          </span>
                          {booking.slipImage && (
                            <span className="text-xs text-amber-600 font-medium">
                              💳 มีสลิป
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Actions */}
                {booking.status === 'confirmed' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
                      title="เสร็จสิ้น"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                    </button>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                      title="ยกเลิก"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    📝 {booking.notes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
