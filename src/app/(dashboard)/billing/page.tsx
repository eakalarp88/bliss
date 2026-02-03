'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Receipt,
  Calendar,
  ChevronRight,
  Check,
  Clock
} from 'lucide-react';
import { Card, Badge, Button, Input, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDate, formatTime, getZoneIcon } from '@/lib/utils';

// Mock bookings that can be billed (completed but not billed)
const pendingBillBookings = [
  {
    id: '1',
    customer: { name: 'คุณแอน', phone: '081-234-5678' },
    service: { name: 'ทำเล็บเจล', zone: 'nail', price: 500 },
    start_time: '10:00',
    end_time: '11:00',
    booking_date: '2025-01-31',
  },
  {
    id: '2',
    customer: { name: 'คุณมาย', phone: '082-345-6789' },
    service: { name: 'ตัดผม + ไดร์', zone: 'hair', price: 350 },
    start_time: '11:30',
    end_time: '12:15',
    booking_date: '2025-01-31',
  },
];

// Mock recent bills
const recentBills = [
  {
    id: 'B001',
    customer: { name: 'คุณจิ๋ว' },
    total_amount: 1500,
    final_amount: 1350,
    discount: 150,
    closed_at: '2025-01-31T13:30:00',
    items: [
      { service: 'ทำสีผม', price: 1500 }
    ]
  },
  {
    id: 'B002',
    customer: { name: 'คุณแนน' },
    total_amount: 800,
    final_amount: 800,
    discount: 0,
    closed_at: '2025-01-31T12:00:00',
    items: [
      { service: 'ต่อเล็บ', price: 800 }
    ]
  },
  {
    id: 'B003',
    customer: { name: 'คุณเอ' },
    total_amount: 200,
    final_amount: 200,
    discount: 0,
    closed_at: '2025-01-31T10:30:00',
    items: [
      { service: 'ตัดผม', price: 200 }
    ]
  },
];

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const todayRevenue = recentBills.reduce((sum, bill) => sum + bill.final_amount, 0);

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="บิล" 
        rightContent={
          <Link href="/billing/new">
            <Button size="sm">
              <Plus className="w-5 h-5" />
              ปิดบิล
            </Button>
          </Link>
        }
      />

      {/* Today's Revenue */}
      <Card className="bg-gradient-to-r from-pink-100 to-beige-100 text-center">
        <p className="text-muted-foreground">รายได้วันนี้</p>
        <p className="text-3xl font-bold text-primary mt-1">
          {formatCurrency(todayRevenue)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {recentBills.length} บิล
        </p>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-primary text-white'
              : 'bg-beige-100 text-foreground hover:bg-beige-200'
          }`}
        >
          <Clock className="w-5 h-5" />
          รอปิดบิล ({pendingBillBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'bg-beige-100 text-foreground hover:bg-beige-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          ประวัติ
        </button>
      </div>

      {/* Search */}
      <Input
        placeholder="ค้นหาชื่อลูกค้า..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Pending Bills */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingBillBookings.length === 0 ? (
            <EmptyState
              icon={<Check className="w-16 h-16 text-success" />}
              title="ไม่มีรายการรอปิดบิล"
              description="บริการทั้งหมดได้ปิดบิลแล้ว"
            />
          ) : (
            pendingBillBookings.map((booking) => (
              <Link key={booking.id} href={`/billing/new?booking=${booking.id}`}>
                <Card 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  padding="md"
                >
                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-primary">{booking.start_time}</p>
                      <p className="text-xs text-muted-foreground">น.</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-border" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getZoneIcon(booking.service.zone)}</span>
                        <p className="font-semibold truncate">{booking.service.name}</p>
                      </div>
                      <p className="text-muted-foreground">
                        {booking.customer.name}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(booking.service.price)}</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Bill History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {recentBills.map((bill) => (
            <Link key={bill.id} href={`/billing/${bill.id}`}>
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                padding="md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    <span className="font-mono text-sm text-muted-foreground">
                      #{bill.id}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(bill.closed_at).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} น.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{bill.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {bill.items.map(i => i.service).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(bill.final_amount)}
                    </p>
                    {bill.discount > 0 && (
                      <p className="text-xs text-success">
                        ส่วนลด {formatCurrency(bill.discount)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
