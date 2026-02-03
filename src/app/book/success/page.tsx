'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Home,
  Loader2
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useBookingStore, type Booking } from '@/lib/store';

export default function BookingSuccessPage() {
  const router = useRouter();
  const { getBookingById } = useBookingStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // SSR check - only access sessionStorage on client
    if (typeof window === 'undefined') return;
    
    const bookingId = sessionStorage.getItem('lastBookingId');
    if (bookingId) {
      const found = getBookingById(bookingId);
      if (found) {
        setBooking(found);
      } else {
        router.push('/book');
      }
    } else {
      router.push('/book');
    }
    setIsLoading(false);
  }, [getBookingById, router]);

  const copyBookingRef = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const bookingDate = new Date(booking.date);

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-green-600">จองสำเร็จ!</h1>
        <p className="text-muted-foreground mt-2">
          ขอบคุณที่ใช้บริการ Bliss ค่ะ
        </p>
      </div>

      {/* Booking Reference */}
      <Card className="bg-gradient-to-r from-pink-50 to-beige-50 text-center mb-4">
        <p className="text-sm text-muted-foreground">หมายเลขการจอง</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-2xl font-bold font-mono tracking-wider">
            {booking.id}
          </p>
          <button
            onClick={copyBookingRef}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          กรุณาจดหมายเลขนี้ไว้สำหรับอ้างอิง
        </p>
      </Card>

      {/* Booking Details */}
      <Card className="mb-4">
        <h3 className="font-semibold text-lg mb-4">รายละเอียดการจอง</h3>
        
        <div className="space-y-4">
          {/* Services */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              booking.zone === 'hair' ? 'bg-pink-100' : 'bg-beige-100'
            }`}>
              <span className="text-lg">{booking.zone === 'hair' ? '💇' : '💅'}</span>
            </div>
            <div className="flex-1">
              {booking.services.length === 1 ? (
                <p className="font-semibold">{booking.services[0].name}</p>
              ) : (
                <>
                  <p className="font-semibold">{booking.services.length} บริการ</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {booking.services.map(s => (
                      <li key={s.id}>• {s.name}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="text-sm text-primary font-medium mt-1">
                ⏱️ รวม {booking.totalDuration} นาที
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">
                {bookingDate.toLocaleDateString('th-TH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                เวลา {booking.time} น.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Shop Info */}
      <Card className="mb-6">
        <h3 className="font-semibold text-lg mb-4">ข้อมูลร้าน</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Bliss Salon</p>
              <p className="text-sm text-muted-foreground">
                แยกลิขิตชีวัน เลี้ยวไปทางโอ้กะจู๋ 300 ม.<br />
                โครงการเดียวกับซักผ้า 24 ชม.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div>
              <a href="tel:0839415967" className="font-medium text-primary">
                083-941-5967
              </a>
              <p className="text-sm text-muted-foreground">โทรจองหรือสอบถาม</p>
            </div>
          </div>
        </div>

        <Button 
          variant="secondary" 
          className="w-full mt-4"
          onClick={() => window.open('https://maps.app.goo.gl/fMYwmietzxrRsWVo7', '_blank')}
        >
          <MapPin className="w-5 h-5" />
          ดูแผนที่
        </Button>
      </Card>

      {/* Important Notes */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📌 สิ่งที่ควรทราบ</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• กรุณามาถึงก่อนเวลานัด 10 นาที</li>
          <li>• หากต้องการยกเลิก/เลื่อนนัด กรุณาแจ้งล่วงหน้า 24 ชม.</li>
          <li>• ราคาอาจเปลี่ยนแปลงตามสภาพงานจริง</li>
        </ul>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('lastBookingId');
            }
            router.push('/book');
          }}
        >
          จองคิวเพิ่ม
        </Button>
        
        <Link href="/book" className="block">
          <Button variant="ghost" className="w-full">
            <Home className="w-5 h-5" />
            กลับหน้าหลัก
          </Button>
        </Link>
      </div>

      {/* SMS Confirmation Notice */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        📩 เราจะส่ง SMS ยืนยันไปที่ {booking.customerPhone}<br />
        และแจ้งเตือนก่อนนัด 1 วัน
      </p>
    </div>
  );
}
