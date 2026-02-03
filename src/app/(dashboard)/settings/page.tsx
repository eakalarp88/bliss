'use client';

import { useState, useEffect } from 'react';
import { 
  Settings,
  Clock,
  Calendar,
  DollarSign,
  Bell,
  Shield,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Save,
  Share2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';

// Mock system config
const initialConfig = {
  shopOpenTime: '09:00',
  shopCloseTime: '20:00',
  timeSlotInterval: '30',
  maxAdvanceBookingDays: '30',
  minCancelHours: '24',
  maxReschedulePerBooking: '1',
  nailDepositAmount: '100',
  hairDepositRequired: false,
  enableLineNotification: true,
  enableSmsNotification: false,
};

export default function SettingsPage() {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('/book');

  // Set URL after mount to avoid hydration error
  useEffect(() => {
    setBookingUrl(`${window.location.origin}/book`);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('บันทึกการตั้งค่าสำเร็จ');
  };

  const updateConfig = (key: keyof typeof config, value: string | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <PageHeader title="ตั้งค่าระบบ" />

      {/* Customer Booking Link */}
      <Card className="bg-gradient-to-r from-pink-50 to-beige-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">ลิงก์จองสำหรับลูกค้า</h3>
            <p className="text-sm text-muted-foreground">แชร์ลิงก์นี้ให้ลูกค้าจองคิวเอง</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-lg px-3 py-2 text-sm font-mono truncate border border-border">
            {bookingUrl}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(bookingUrl);
              alert('คัดลอกลิงก์แล้ว!');
            }}
            className="px-3 py-2 bg-white rounded-lg border border-border hover:bg-beige-50 transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
          <a 
            href="/book" 
            target="_blank"
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-pink-400 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </Card>

      {/* Shop Hours */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-semibold">เวลาเปิด-ปิดร้าน</h3>
            <p className="text-sm text-muted-foreground">กำหนดเวลาที่รับจอง</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="เวลาเปิด"
            type="time"
            value={config.shopOpenTime}
            onChange={(e) => updateConfig('shopOpenTime', e.target.value)}
          />
          <Input
            label="เวลาปิด"
            type="time"
            value={config.shopCloseTime}
            onChange={(e) => updateConfig('shopCloseTime', e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Input
            label="ช่วงเวลาจอง (นาที)"
            type="number"
            value={config.timeSlotInterval}
            onChange={(e) => updateConfig('timeSlotInterval', e.target.value)}
            hint="เช่น 30 นาที = จองได้ทุก :00 และ :30"
          />
        </div>
      </Card>

      {/* Booking Rules */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">กฎการจอง</h3>
            <p className="text-sm text-muted-foreground">ตั้งค่าเงื่อนไขการจอง</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="จองล่วงหน้าได้สูงสุด (วัน)"
            type="number"
            value={config.maxAdvanceBookingDays}
            onChange={(e) => updateConfig('maxAdvanceBookingDays', e.target.value)}
          />

          <Input
            label="ยกเลิกก่อนนัดอย่างน้อย (ชั่วโมง)"
            type="number"
            value={config.minCancelHours}
            onChange={(e) => updateConfig('minCancelHours', e.target.value)}
          />

          <Input
            label="เลื่อนนัดได้สูงสุด (ครั้ง/การจอง)"
            type="number"
            value={config.maxReschedulePerBooking}
            onChange={(e) => updateConfig('maxReschedulePerBooking', e.target.value)}
          />
        </div>
      </Card>

      {/* Deposit Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">ค่ามัดจำ</h3>
            <p className="text-sm text-muted-foreground">ตั้งค่าการเก็บมัดจำ</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="ค่ามัดจำโซนเล็บ (บาท)"
            type="number"
            value={config.nailDepositAmount}
            onChange={(e) => updateConfig('nailDepositAmount', e.target.value)}
          />

          <div className="flex items-center justify-between p-4 bg-beige-50 rounded-xl">
            <div>
              <p className="font-semibold">โซนผมต้องมัดจำ</p>
              <p className="text-sm text-muted-foreground">เปิดเพื่อเก็บมัดจำทุกบริการโซนผม</p>
            </div>
            <button onClick={() => updateConfig('hairDepositRequired', !config.hairDepositRequired)}>
              {config.hairDepositRequired ? (
                <ToggleRight className="w-10 h-10 text-success" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold">การแจ้งเตือน</h3>
            <p className="text-sm text-muted-foreground">ตั้งค่าการแจ้งเตือนลูกค้า</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-beige-50 rounded-xl">
            <div>
              <p className="font-semibold">แจ้งเตือนผ่าน LINE</p>
              <p className="text-sm text-muted-foreground">ส่งข้อความเตือนนัดหมาย</p>
            </div>
            <button onClick={() => updateConfig('enableLineNotification', !config.enableLineNotification)}>
              {config.enableLineNotification ? (
                <ToggleRight className="w-10 h-10 text-success" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-beige-50 rounded-xl">
            <div>
              <p className="font-semibold">แจ้งเตือนผ่าน SMS</p>
              <p className="text-sm text-muted-foreground">ส่ง SMS เตือนนัดหมาย</p>
            </div>
            <button onClick={() => updateConfig('enableSmsNotification', !config.enableSmsNotification)}>
              {config.enableSmsNotification ? (
                <ToggleRight className="w-10 h-10 text-success" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Other Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold">อื่นๆ</h3>
          </div>
        </div>

        <div className="space-y-2">
          <a href="/commissions" className="w-full flex items-center justify-between p-4 hover:bg-beige-50 rounded-xl transition-colors">
            <span className="font-medium">จัดการกฎคอมมิชชั่น</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>
          <button className="w-full flex items-center justify-between p-4 hover:bg-beige-50 rounded-xl transition-colors">
            <span className="font-medium">สำรองข้อมูล</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-beige-50 rounded-xl transition-colors text-destructive">
            <span className="font-medium">ลบข้อมูลทั้งหมด</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        isLoading={isSaving}
        className="w-full"
        size="lg"
      >
        <Save className="w-5 h-5" />
        บันทึกการตั้งค่า
      </Button>
    </div>
  );
}
