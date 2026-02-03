'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  User
} from 'lucide-react';
import { Card, Badge, Button, Input, Avatar, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatPhone } from '@/lib/utils';

// Mock customers data
const mockCustomers = [
  {
    id: '1',
    name: 'คุณแอน',
    phone: '0812345678',
    total_spent: 15600,
    booking_count: 12,
    no_show_count: 0,
    last_visit: '2025-01-28',
  },
  {
    id: '2',
    name: 'คุณมาย',
    phone: '0823456789',
    total_spent: 8200,
    booking_count: 6,
    no_show_count: 1,
    last_visit: '2025-01-25',
  },
  {
    id: '3',
    name: 'คุณจิ๋ว',
    phone: '0834567890',
    total_spent: 45000,
    booking_count: 24,
    no_show_count: 0,
    last_visit: '2025-01-30',
  },
  {
    id: '4',
    name: 'คุณส้ม',
    phone: '0845678901',
    total_spent: 3200,
    booking_count: 3,
    no_show_count: 2,
    last_visit: '2025-01-15',
  },
  {
    id: '5',
    name: 'คุณแนน',
    phone: '0856789012',
    total_spent: 22500,
    booking_count: 15,
    no_show_count: 0,
    last_visit: '2025-01-29',
  },
];

type SortOption = 'recent' | 'spent' | 'visits' | 'name';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Filter and sort customers
  const filteredCustomers = mockCustomers
    .filter((customer) => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery.replace(/-/g, ''))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'spent':
          return b.total_spent - a.total_spent;
        case 'visits':
          return b.booking_count - a.booking_count;
        case 'name':
          return a.name.localeCompare(b.name, 'th');
        case 'recent':
        default:
          return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
      }
    });

  // Stats
  const totalCustomers = mockCustomers.length;
  const vipCustomers = mockCustomers.filter(c => c.total_spent >= 10000).length;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="ลูกค้า" 
        subtitle={`${totalCustomers} คน`}
        rightContent={
          <Link href="/customers/new">
            <Button size="sm">
              <Plus className="w-5 h-5" />
              เพิ่ม
            </Button>
          </Link>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center" padding="md">
          <p className="text-3xl font-bold text-primary">{totalCustomers}</p>
          <p className="text-sm text-muted-foreground">ลูกค้าทั้งหมด</p>
        </Card>
        <Card className="text-center bg-gradient-to-br from-amber-50 to-white" padding="md">
          <p className="text-3xl font-bold text-amber-600">{vipCustomers}</p>
          <p className="text-sm text-muted-foreground">ลูกค้า VIP</p>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="ค้นหาชื่อหรือเบอร์โทร..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'recent', label: 'ล่าสุด' },
          { value: 'spent', label: 'ยอดใช้จ่าย' },
          { value: 'visits', label: 'ครั้งที่มา' },
          { value: 'name', label: 'ชื่อ' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value as SortOption)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              sortBy === option.value
                ? 'bg-primary text-white'
                : 'bg-beige-100 text-foreground hover:bg-beige-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<User className="w-16 h-16" />}
          title="ไม่พบลูกค้า"
          description="ลองค้นหาด้วยชื่อหรือเบอร์โทรอื่น"
        />
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                padding="md"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar name={customer.name} size="lg" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg truncate">
                        {customer.name}
                      </p>
                      {customer.total_spent >= 10000 && (
                        <Badge variant="warning" size="sm">VIP</Badge>
                      )}
                      {customer.no_show_count >= 2 && (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          No-show
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {formatPhone(customer.phone)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(customer.total_spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.booking_count} ครั้ง
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
