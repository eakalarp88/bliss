'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  Bell, 
  Settings,
  LogOut,
  User,
  ChevronRight,
  X,
  Calculator,
  Scissors
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './ui';

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
}

// Mock current user - replace with actual auth
const currentUser = {
  name: 'คุณชมพู',
  role: 'owner' as const,
};

const menuItems = [
  { href: '/staff', label: 'จัดการพนักงาน', icon: User },
  { href: '/services', label: 'จัดการบริการ', icon: Scissors },
  { href: '/commissions', label: 'คอมมิชชั่น', icon: Calculator },
  { href: '/settings', label: 'ตั้งค่าระบบ', icon: Settings },
];

export function Header({ 
  title = 'Bliss', 
  showMenu = true,
  showNotifications = true 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Menu or Logo */}
          <div className="flex items-center gap-3">
            {showMenu && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-beige-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">💅💇</span>
              <h1 className="text-xl font-bold text-primary">{title}</h1>
            </Link>
          </div>

          {/* Right: Notifications & Avatar */}
          <div className="flex items-center gap-2">
            {showNotifications && (
              <button className="relative p-2 rounded-lg hover:bg-beige-100 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
            )}
            <Avatar name={currentUser.name} size="sm" />
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-xl animate-slide-in-left">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-pink-50 to-beige-50">
              <div className="flex items-center gap-3">
                <Avatar name={currentUser.name} size="lg" />
                <div>
                  <p className="font-semibold text-lg">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">เจ้าของร้าน</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-beige-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <button className="flex items-center gap-3 w-full p-4 rounded-xl text-destructive hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
