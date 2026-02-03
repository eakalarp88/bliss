'use client';

import { useState, useEffect, useRef } from 'react';
import { 
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
  Copy,
  CreditCard,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';

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
  
  // QR Code state
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set URL after mount to avoid hydration error
  useEffect(() => {
    setBookingUrl(`${window.location.origin}/book`);
  }, []);

  // Fetch QR settings from Supabase
  useEffect(() => {
    fetchQrSettings();
  }, []);

  const fetchQrSettings = async () => {
    setIsLoadingQr(true);
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('key, value')
        .in('key', ['payment_qr_image', 'payment_bank_name', 'payment_account_name']);

      if (error) throw error;

      data?.forEach(item => {
        if (item.key === 'payment_qr_image') setQrImage(item.value);
        if (item.key === 'payment_bank_name') setBankName(item.value || '');
        if (item.key === 'payment_account_name') setAccountName(item.value || '');
      });
    } catch (error) {
      console.error('Error fetching QR settings:', error);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไป (สูงสุด 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setQrImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQr = async () => {
    setIsSavingQr(true);
    try {
      // Update all QR settings
      const updates = [
        { key: 'payment_qr_image', value: qrImage },
        { key: 'payment_bank_name', value: bankName },
        { key: 'payment_account_name', value: accountName },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shop_settings')
          .upsert({ key: update.key, value: update.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) throw error;
      }

      alert('บันทึก QR Code สำเร็จ!');
    } catch (error) {
      console.error('Error saving QR settings:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleDeleteQr = async () => {
    if (!confirm('ต้องการลบ QR Code นี้ใช่ไหม?')) return;

    setIsSavingQr(true);
    try {
      const updates = [
        { key: 'payment_qr_image', value: null },
        { key: 'payment_bank_name', value: null },
        { key: 'payment_account_name', value: null },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shop_settings')
          .upsert({ key: update.key, value: update.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) throw error;
      }

      setQrImage(null);
      setBankName('');
      setAccountName('');
      alert('ลบ QR Code สำเร็จ');
    } catch (error) {
      console.error('Error deleting QR:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSavingQr(false);
    }
  };

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

      {/* QR Code Payment */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold">QR Code รับชำระเงิน</h3>
            <p className="text-sm text-muted-foreground">แสดงให้ลูกค้าโอนเงินมัดจำ</p>
          </div>
        </div>

        {isLoadingQr ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Image Preview */}
            <div className="flex flex-col items-center">
              {qrImage ? (
                <div className="relative">
                  <img 
                    src={qrImage} 
                    alt="QR Code" 
                    className="w-48 h-48 object-contain rounded-xl border border-border"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-beige-50"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-48 h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-pink-50/50 transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">อัปโหลด QR Code</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrImageUpload}
                className="hidden"
              />
            </div>

            {/* Bank Info */}
            <Input
              label="ชื่อธนาคาร"
              placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />

            <Input
              label="ชื่อบัญชี"
              placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />

            {/* Actions */}
            <div className="flex gap-2">
              {qrImage && (
                <Button 
                  variant="secondary" 
                  onClick={handleDeleteQr}
                  disabled={isSavingQr}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบ
                </Button>
              )}
              <Button 
                onClick={handleSaveQr}
                disabled={isSavingQr || !qrImage}
                isLoading={isSavingQr}
                className="flex-1"
              >
                <Save className="w-4 h-4" />
                บันทึก QR
              </Button>
            </div>
          </div>
        )}
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
