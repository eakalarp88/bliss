'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  PlusCircle, 
  Users, 
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'หน้าหลัก' },
  { href: '/bookings', icon: Calendar, label: 'จอง' },
  { href: '/bookings/new', icon: PlusCircle, label: 'เพิ่ม', isMain: true },
  { href: '/customers', icon: Users, label: 'ลูกค้า' },
  { href: '/reports', icon: BarChart3, label: 'รายงาน' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'bottom-nav-item',
              isActive && 'active',
              item.isMain && '-mt-4'
            )}
          >
            {item.isMain ? (
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <item.icon className="w-7 h-7 text-white" />
              </div>
            ) : (
              <>
                <item.icon className={cn(
                  'w-6 h-6',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
