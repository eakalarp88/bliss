'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Scissors, 
  Sparkles, 
  Calendar,
  Clock,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { generateTimeSlots, getThaiDayName, isValidThaiPhone, formatLocalDate } from '@/lib/utils';
import { useBookingStore, getUnavailableTimes, isTimeSlotAvailable, type Service } from '@/lib/store';
import { AlertTriangle, Loader2 as LoaderIcon, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Generate next 14 days for date selection
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Generate all possible time slots (will be filtered by service)
const allTimeSlots = generateTimeSlots(8, 22, 30);

export default function CustomerBookingPage() {
  const router = useRouter();
  const { 
    services, 
    bookings, 
    addBooking, 
    fetchServices, 
    fetchBookings,
    fetchStaff,
    fetchStaffSchedules,
    getZoneCapacity
  } = useBookingStore();
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    fetchServices();
    fetchBookings();
    fetchStaff();
    fetchStaffSchedules();
  }, [fetchServices, fetchBookings, fetchStaff, fetchStaffSchedules]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [selectedZone, setSelectedZone] = useState<'hair' | 'nail' | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]); // Multiple services
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [slipImage, setSlipImage] = useState<string | null>(null); // For nail zone
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // QR Code state
  const [paymentQr, setPaymentQr] = useState<{
    image: string | null;
    bankName: string | null;
    accountName: string | null;
  }>({ image: null, bankName: null, accountName: null });
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  // Ensure component is mounted before accessing sessionStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch QR Code settings
  useEffect(() => {
    const fetchQrSettings = async () => {
      setIsLoadingQr(true);
      try {
        const { data, error } = await supabase
          .from('shop_settings')
          .select('key, value')
          .in('key', ['payment_qr_image', 'payment_bank_name', 'payment_account_name']);

        if (error) throw error;

        const qrData: typeof paymentQr = { image: null, bankName: null, accountName: null };
        data?.forEach(item => {
          if (item.key === 'payment_qr_image') qrData.image = item.value;
          if (item.key === 'payment_bank_name') qrData.bankName = item.value;
          if (item.key === 'payment_account_name') qrData.accountName = item.value;
        });
        setPaymentQr(qrData);
      } catch (error) {
        console.error('Error fetching QR settings:', error);
      } finally {
        setIsLoadingQr(false);
      }
    };

    fetchQrSettings();
  }, []);

  const dates = generateDates();

  // Calculate total duration of selected services
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Get the earliest availableFrom and latest availableTo from selected services
  const getAvailableTimeRange = () => {
    if (selectedServices.length === 0) return { from: '08:00', to: '22:00' };
    
    const fromTimes = selectedServices.map(s => s.availableFrom);
    const toTimes = selectedServices.map(s => s.availableTo);
    
    // Latest start time (most restrictive)
    const latestFrom = fromTimes.sort().reverse()[0];
    // Earliest end time (most restrictive)
    const earliestTo = toTimes.sort()[0];
    
    return { from: latestFrom, to: earliestTo };
  };

  // Get zone capacity for selected date
  const dateString = selectedDate ? formatLocalDate(selectedDate) : '';
  const zoneCapacity = selectedDate && selectedZone 
    ? getZoneCapacity(selectedZone, dateString)
    : 0;

  // Get unavailable times based on selected date, zone, total duration, and capacity
  const unavailableTimes = selectedDate && selectedZone && selectedServices.length > 0
    ? getUnavailableTimes(
        bookings,
        dateString,
        selectedZone,
        totalDuration,
        30,
        zoneCapacity
      )
    : [];

  // Check if selected date is today
  const isSelectedDateToday = selectedDate?.toDateString() === new Date().toDateString();

  // Filter time slots based on selected services' available hours
  const availableTimeSlots = selectedServices.length > 0
    ? allTimeSlots.filter(time => {
        const [hour, minute] = time.split(':').map(Number);
        const { from, to } = getAvailableTimeRange();
        const [fromHour, fromMinute] = from.split(':').map(Number);
        const [toHour, toMinute] = to.split(':').map(Number);
        
        const timeInMinutes = hour * 60 + minute;
        const fromInMinutes = fromHour * 60 + fromMinute;
        const toInMinutes = toHour * 60 + toMinute;
        
        // Block past times for today (with 30 min buffer)
        if (isSelectedDateToday) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30; // 30 min buffer
          if (timeInMinutes < currentMinutes) {
            return false;
          }
        }
        
        // Make sure the service can finish before closing
        return timeInMinutes >= fromInMinutes && (timeInMinutes + totalDuration) <= toInMinutes;
      })
    : allTimeSlots;

  // Filter services by zone (only active services for customer booking)
  const hairServices = services.filter(s => s.zone === 'hair' && s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const nailServices = services.filter(s => s.zone === 'nail' && s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  // Toggle service selection (for multi-select)
  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
    // Reset time when services change
    setSelectedTime(null);
  };

  // Handle file upload for slip
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Move to next step
  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  // Move to previous step
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validate phone number
  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }
    if (!isValidThaiPhone(phone)) {
      setPhoneError('เบอร์โทรไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08, 09 และมี 10 หลัก)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // Check if can proceed
  const canProceed = () => {
    switch (step) {
      case 1: return selectedServices.length > 0;
      case 2: return selectedDate !== null && selectedTime !== null && zoneCapacity > 0;
      case 3: return customerName.trim() !== '' && isValidThaiPhone(customerPhone);
      default: return false;
    }
  };

  // Handle booking submission
  const handleSubmit = async () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime || !selectedZone) return;
    
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // Re-validate time slot availability before submission
      const dateStr = formatLocalDate(selectedDate);
      const capacity = getZoneCapacity(selectedZone, dateStr);
      const isAvailable = isTimeSlotAvailable(
        bookings,
        dateStr,
        selectedTime,
        selectedZone,
        totalDuration,
        capacity
      );
      
      if (!isAvailable) {
        setSubmitError('ขออภัย เวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาอื่น');
        setIsSubmitting(false);
        setStep(2); // Go back to time selection
        return;
      }
      
      // Simulate a small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add booking to store
      const bookingId = await addBooking({
        services: selectedServices,
        totalDuration,
        zone: selectedZone,
        date: dateStr,
        time: selectedTime,
        customerName,
        customerPhone,
        notes: notes || undefined,
        slipImage: slipImage || undefined,
        status: 'confirmed',
        channel: 'web',
      });
      
      if (!bookingId) {
        setSubmitError('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่');
        return;
      }
      
      // Store for success page (with SSR check)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastBookingId', bookingId);
      }
      
      router.push('/book/success');
    } catch (error) {
      console.error('Booking submission error:', error);
      setSubmitError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {['บริการ', 'วัน/เวลา', 'ข้อมูล', 'ยืนยัน'].map((label, index) => (
            <div 
              key={label}
              className={`flex flex-col items-center ${
                index + 1 <= step ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                index + 1 < step 
                  ? 'bg-primary text-white' 
                  : index + 1 === step 
                  ? 'bg-primary text-white'
                  : 'bg-beige-100'
              }`}>
                {index + 1 < step ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-beige-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Select Services */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">เลือกบริการ</h2>
            <p className="text-muted-foreground mt-1">
              {selectedZone === 'nail' ? 'เลือกได้หลายบริการ' : 'เลือกบริการที่ต้องการ'}
            </p>
          </div>

          {/* Zone Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setSelectedZone('hair');
                setSelectedServices([]);
                setSlipImage(null);
              }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedZone === 'hair'
                  ? 'border-primary bg-pink-50 shadow-lg scale-[1.02]'
                  : 'border-border hover:border-pink-200 bg-white'
              }`}
            >
              <Scissors className="w-12 h-12 mx-auto text-pink-500 mb-2" />
              <p className="font-bold text-lg">โซนผม</p>
              <p className="text-sm text-muted-foreground">{hairServices.length} บริการ</p>
            </button>
            
            <button
              onClick={() => {
                setSelectedZone('nail');
                setSelectedServices([]);
                setSlipImage(null);
              }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedZone === 'nail'
                  ? 'border-primary bg-beige-50 shadow-lg scale-[1.02]'
                  : 'border-border hover:border-beige-200 bg-white'
              }`}
            >
              <Sparkles className="w-12 h-12 mx-auto text-beige-400 mb-2" />
              <p className="font-bold text-lg">โซนเล็บ</p>
              <p className="text-sm text-muted-foreground">{nailServices.length} บริการ</p>
            </button>
          </div>

          {/* Service List */}
          {selectedZone && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-lg">
                  {selectedZone === 'hair' ? '💇 บริการโซนผม' : '💅 บริการโซนเล็บ'}
                </p>
                {selectedZone === 'nail' && (
                  <span className="text-sm text-primary font-medium">
                    เลือกได้หลายรายการ
                  </span>
                )}
              </div>
              
              {(selectedZone === 'hair' ? hairServices : nailServices).map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (selectedZone === 'hair') {
                        // Hair zone: single select
                        setSelectedServices([service]);
                      } else {
                        // Nail zone: multi select
                        toggleService(service);
                      }
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-pink-50 shadow-md'
                        : 'border-border hover:border-pink-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{service.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ⏱️ ประมาณ {service.duration} นาที
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Services Summary */}
          {selectedServices.length > 0 && (
            <Card className="bg-gradient-to-r from-pink-50 to-beige-50">
              <p className="font-semibold mb-2">บริการที่เลือก ({selectedServices.length})</p>
              <div className="space-y-1">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.duration} นาที</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold">
                <span>รวมเวลา</span>
                <span className="text-primary">{totalDuration} นาที</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">เลือกวันและเวลา</h2>
            <p className="text-muted-foreground mt-1">เลือกวันเวลาที่สะดวก</p>
          </div>

          {/* Selected Services Summary */}
          <Card className="bg-gradient-to-r from-pink-50 to-beige-50">
            <div className="flex items-center gap-3">
              {selectedZone === 'hair' 
                ? <Scissors className="w-8 h-8 text-pink-500" />
                : <Sparkles className="w-8 h-8 text-beige-400" />
              }
              <div className="flex-1">
                <p className="font-semibold">
                  {selectedServices.map(s => s.name).join(' + ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  ⏱️ รวม {totalDuration} นาที
                </p>
              </div>
            </div>
          </Card>

          {/* Date Selection */}
          <div>
            <label className="block font-semibold mb-3">
              <Calendar className="w-5 h-5 inline mr-2" />
              เลือกวันที่
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {dates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`flex-shrink-0 w-16 p-3 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white border border-border hover:border-primary'
                    }`}
                  >
                    <p className="text-xs font-medium">
                      {isToday ? 'วันนี้' : getThaiDayName(date).slice(0, 2)}
                    </p>
                    <p className="text-2xl font-bold mt-1">{date.getDate()}</p>
                    <p className="text-xs">
                      {date.toLocaleDateString('th-TH', { month: 'short' })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block font-semibold mb-3">
                <Clock className="w-5 h-5 inline mr-2" />
                เลือกเวลา
              </label>
              
              {/* Show warning if no staff available */}
              {zoneCapacity === 0 ? (
                <Card className="bg-orange-50 border-orange-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800">ไม่เปิดให้บริการ</p>
                      <p className="text-sm text-orange-700 mt-1">
                        วันที่เลือกไม่มีพนักงานพร้อมให้บริการ กรุณาเลือกวันอื่น
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimeSlots.map((time) => {
                      const isUnavailable = unavailableTimes.includes(time);
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => !isUnavailable && setSelectedTime(time)}
                          disabled={isUnavailable}
                          className={`py-3 px-2 rounded-xl text-center font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-white shadow-md'
                              : isUnavailable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : 'bg-white border border-border hover:border-primary'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  {availableTimeSlots.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      ไม่มีเวลาว่างสำหรับบริการนี้
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    * เวลาที่ขีดฆ่าคือเวลาที่ไม่ว่าง
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Customer Info */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">ข้อมูลการติดต่อ</h2>
            <p className="text-muted-foreground mt-1">กรอกข้อมูลเพื่อยืนยันการจอง</p>
          </div>

          <div className="space-y-4">
            <Input
              label="ชื่อ"
              placeholder="ชื่อเล่น หรือ ชื่อจริง"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              leftIcon={<User className="w-5 h-5" />}
            />

            <div>
              <Input
                label="เบอร์โทรศัพท์"
                placeholder="08X-XXX-XXXX"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                onBlur={() => validatePhone(customerPhone)}
                leftIcon={<Phone className="w-5 h-5" />}
                type="tel"
              />
              {phoneError && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-base font-semibold text-foreground mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น อยากได้ช่างคนเดิม, แพ้สารเคมี..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none resize-none h-24"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Summary & Slip Upload */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">ตรวจสอบการจอง</h2>
            <p className="text-muted-foreground mt-1">กรุณาตรวจสอบข้อมูลก่อนยืนยัน</p>
          </div>

          <Card className="space-y-4">
            {/* Services */}
            <div className="pb-4 border-b border-border">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedZone === 'hair' ? 'bg-pink-100' : 'bg-beige-100'
                }`}>
                  {selectedZone === 'hair' 
                    ? <Scissors className="w-7 h-7 text-pink-500" />
                    : <Sparkles className="w-7 h-7 text-beige-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {selectedServices.length === 1 
                      ? selectedServices[0].name 
                      : `${selectedServices.length} บริการ`}
                  </p>
                  {selectedServices.length > 1 && (
                    <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {selectedServices.map(s => (
                        <li key={s.id}>• {s.name} ({s.duration} นาที)</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-primary font-medium mt-1">
                    ⏱️ รวม {totalDuration} นาที
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="font-bold">
                  {selectedDate?.toLocaleDateString('th-TH', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-muted-foreground">
                  เวลา {selectedTime} น.
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                <User className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="font-bold">{customerName}</p>
                <p className="text-muted-foreground">{customerPhone}</p>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">หมายเหตุ:</p>
                <p className="mt-1">{notes}</p>
              </div>
            )}
          </Card>

          {/* Payment QR Code & Slip Upload - Required for nail zone */}
          {selectedZone === 'nail' && (
            <>
              {/* QR Code Display */}
              {isLoadingQr ? (
                <Card className="flex items-center justify-center py-8">
                  <LoaderIcon className="w-8 h-8 animate-spin text-primary" />
                </Card>
              ) : paymentQr.image ? (
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-800">โอนเงินมัดจำ</p>
                    </div>
                    
                    <img 
                      src={paymentQr.image} 
                      alt="QR Code ชำระเงิน" 
                      className="w-48 h-48 mx-auto object-contain rounded-xl border border-emerald-200 bg-white"
                    />
                    
                    {(paymentQr.bankName || paymentQr.accountName) && (
                      <div className="mt-3 text-sm text-emerald-700">
                        {paymentQr.bankName && <p>ธนาคาร: <strong>{paymentQr.bankName}</strong></p>}
                        {paymentQr.accountName && <p>ชื่อบัญชี: <strong>{paymentQr.accountName}</strong></p>}
                      </div>
                    )}
                  </div>
                </Card>
              ) : null}

              {/* Slip Upload */}
              <Card className={`border-2 ${slipImage ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`}>
                <div className="text-center">
                  <p className={`font-semibold mb-2 ${slipImage ? 'text-green-800' : 'text-amber-800'}`}>
                    💳 แนบสลิปยืนยันการโอนเงิน <span className="text-red-500">*</span>
                  </p>
                  <p className={`text-sm mb-4 ${slipImage ? 'text-green-700' : 'text-amber-700'}`}>
                    {slipImage ? '✓ แนบสลิปเรียบร้อยแล้ว' : 'กรุณาโอนเงินมัดจำและแนบสลิป (บังคับ)'}
                  </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {slipImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={slipImage} 
                      alt="สลิปโอนเงิน" 
                      className="max-w-full h-48 object-contain rounded-xl border-2 border-amber-300"
                    />
                    <button
                      onClick={() => setSlipImage(null)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-amber-300 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                    <p className="font-medium text-amber-700">แตะเพื่ออัปโหลดสลิป</p>
                    <p className="text-sm text-amber-600 mt-1">รองรับ JPG, PNG</p>
                  </button>
                )}
              </div>
            </Card>
            </>
          )}

          {/* Error Messages */}
          {submitError && (
            <Card className="bg-red-50 border-2 border-red-300">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{submitError}</p>
              </div>
            </Card>
          )}

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            {selectedZone === 'nail' && !slipImage && (
              <span className="text-red-500 block mb-2">
                ⚠️ กรุณาแนบสลิปโอนเงินก่อนยืนยัน
              </span>
            )}
            การกดยืนยันหมายความว่าคุณยอมรับ<br />
            <span className="text-primary">เงื่อนไขการจอง</span> และ <span className="text-primary">นโยบายการยกเลิก</span>
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button 
            variant="secondary" 
            onClick={prevStep}
            className="flex-1"
            disabled={isSubmitting}
          >
            <ChevronLeft className="w-5 h-5" />
            ย้อนกลับ
          </Button>
        )}
        
        {step < 4 ? (
          <Button 
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex-1"
          >
            ถัดไป
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedZone === 'nail' && !slipImage)}
            isLoading={isSubmitting}
            className="flex-1 bg-green-500 hover:bg-green-600"
          >
            <Check className="w-5 h-5" />
            ยืนยันการจอง
          </Button>
        )}
      </div>
    </div>
  );
}
