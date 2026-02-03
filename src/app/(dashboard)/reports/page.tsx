'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Scissors,
  Sparkles,
  DollarSign,
  BarChart3,
  PieChart,
  ChevronRight
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency } from '@/lib/utils';

// Mock report data
const reportData = {
  today: {
    revenue: 4500,
    bookings: 8,
    completed: 5,
    hairRevenue: 2500,
    nailRevenue: 2000,
  },
  thisWeek: {
    revenue: 32500,
    bookings: 45,
    completed: 42,
    hairRevenue: 18500,
    nailRevenue: 14000,
  },
  thisMonth: {
    revenue: 145000,
    bookings: 180,
    completed: 172,
    hairRevenue: 85000,
    nailRevenue: 60000,
    newCustomers: 15,
    returningCustomers: 45,
  },
  topStaff: [
    { name: 'พี่หมู', revenue: 45000, services: 38, zone: 'hair' },
    { name: 'พี่แอน', revenue: 38500, services: 52, zone: 'nail' },
    { name: 'พี่เอ', revenue: 32000, services: 28, zone: 'hair' },
    { name: 'น้องมิ้ว', revenue: 29500, services: 45, zone: 'nail' },
  ],
  topServices: [
    { name: 'ทำเล็บเจล', count: 45, revenue: 22500 },
    { name: 'ตัดผม', count: 38, revenue: 7600 },
    { name: 'ทำสีผม', count: 25, revenue: 37500 },
    { name: 'สปาเท้า', count: 22, revenue: 8800 },
  ],
};

type Period = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');

  const currentData = selectedPeriod === 'today' 
    ? reportData.today 
    : selectedPeriod === 'week' 
    ? reportData.thisWeek 
    : reportData.thisMonth;

  const completionRate = Math.round((currentData.completed / currentData.bookings) * 100);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <PageHeader title="รายงาน" />

      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { value: 'today', label: 'วันนี้' },
          { value: 'week', label: 'สัปดาห์นี้' },
          { value: 'month', label: 'เดือนนี้' },
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as Period)}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary text-white'
                : 'bg-beige-100 text-foreground hover:bg-beige-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Revenue Summary */}
      <Card className="bg-gradient-to-br from-pink-100 to-beige-100">
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-2">รายได้รวม</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(currentData.revenue)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-success">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+12% จากช่วงก่อน</span>
          </div>
        </div>
      </Card>

      {/* Revenue by Zone */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-pink-500" />
            </div>
            <p className="font-semibold">โซนผม</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(currentData.hairRevenue)}</p>
          <p className="text-sm text-muted-foreground">
            {Math.round((currentData.hairRevenue / currentData.revenue) * 100)}% ของรายได้
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-beige-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-beige-400" />
            </div>
            <p className="font-semibold">โซนเล็บ</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(currentData.nailRevenue)}</p>
          <p className="text-sm text-muted-foreground">
            {Math.round((currentData.nailRevenue / currentData.revenue) * 100)}% ของรายได้
          </p>
        </Card>
      </div>

      {/* Booking Stats */}
      <Card>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          สถิติการจอง
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-info">{currentData.bookings}</p>
            <p className="text-sm text-muted-foreground">นัดหมาย</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{currentData.completed}</p>
            <p className="text-sm text-muted-foreground">เสร็จสิ้น</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{completionRate}%</p>
            <p className="text-sm text-muted-foreground">อัตราสำเร็จ</p>
          </div>
        </div>
      </Card>

      {/* Top Staff */}
      <Card>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          พนักงานยอดเยี่ยม
        </h3>
        <div className="space-y-3">
          {reportData.topStaff.map((staff, index) => (
            <div 
              key={staff.name}
              className="flex items-center gap-3 p-3 bg-beige-50 rounded-xl"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-amber-400 text-white' :
                index === 1 ? 'bg-gray-300 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-beige-200 text-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{staff.name}</p>
                <p className="text-sm text-muted-foreground">
                  {staff.services} บริการ • {staff.zone === 'hair' ? '💇 ผม' : '💅 เล็บ'}
                </p>
              </div>
              <p className="font-bold text-primary">{formatCurrency(staff.revenue)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Services */}
      <Card>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          บริการยอดนิยม
        </h3>
        <div className="space-y-3">
          {reportData.topServices.map((service, index) => (
            <div key={service.name} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.count} ครั้ง</p>
                </div>
                <div className="h-2 bg-beige-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-300 rounded-full"
                    style={{ 
                      width: `${(service.count / reportData.topServices[0].count) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <p className="font-semibold text-sm w-20 text-right">
                {formatCurrency(service.revenue)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Customer Stats (Month only) */}
      {selectedPeriod === 'month' && (
        <Card>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            ลูกค้า
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {reportData.thisMonth.newCustomers}
              </p>
              <p className="text-sm text-muted-foreground">ลูกค้าใหม่</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {reportData.thisMonth.returningCustomers}
              </p>
              <p className="text-sm text-muted-foreground">ลูกค้าประจำ</p>
            </div>
          </div>
        </Card>
      )}

      {/* Commission Link */}
      <Link href="/commissions">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">คอมมิชชั่นพนักงาน</p>
                <p className="text-sm text-muted-foreground">ดูยอดค้างจ่ายและตั้งค่ากฎ</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
