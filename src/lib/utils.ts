import { type ClassValue, clsx } from 'clsx';

// Combine class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency in Thai Baht
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in Thai
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date to YYYY-MM-DD using local timezone (avoid UTC issues)
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date string in local timezone
export function getTodayString(): string {
  return formatLocalDate(new Date());
}

// Format date short
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

// Format time
export function formatTime(time: string): string {
  return time.substring(0, 5); // HH:mm
}

// Calculate end time from start time and duration
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Get Thai day name
export function getThaiDayName(date: Date): string {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return days[date.getDay()];
}

// Check if date is today
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

// Check if date is in the past
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

// Generate time slots for booking
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 20,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Phone number formatting
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Validate Thai phone number
export function isValidThaiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^0[689]\d{8}$/.test(cleaned);
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Status color mapping
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    'no-show': 'badge-warning',
    pending: 'badge-warning',
    paid: 'badge-success',
    refunded: 'badge-info',
  };
  return colors[status] || 'badge-info';
}

// Status Thai text
export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    confirmed: 'ยืนยันแล้ว',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    'no-show': 'ไม่มา',
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    refunded: 'คืนเงินแล้ว',
    not_required: 'ไม่ต้องมัดจำ',
  };
  return texts[status] || status;
}

// Zone Thai text
export function getZoneText(zone: string): string {
  return zone === 'hair' ? 'โซนผม' : 'โซนเล็บ';
}

// Zone icon
export function getZoneIcon(zone: string): string {
  return zone === 'hair' ? '💇' : '💅';
}

// Role Thai text
export function getRoleText(role: string): string {
  const roles: Record<string, string> = {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการ',
    reception: 'พนักงานต้อนรับ',
    hair: 'ช่างทำผม',
    nail: 'ช่างทำเล็บ',
  };
  return roles[role] || role;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
