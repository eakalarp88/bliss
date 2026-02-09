'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Scissors,
  Sparkles,
  Search,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { generateTimeSlots, isValidThaiPhone, getTodayString, formatLocalDate } from '@/lib/utils';
import { useBookingStore, getUnavailableTimes, isTimeSlotAvailable, type Service } from '@/lib/store';

// Mock existing customers for search (would come from backend)
const existingCustomers = [
  { id: '1', name: 'คุณแอน', phone: '0812345678' },
  { id: '2', name: 'คุณมาย', phone: '0823456789' },
  { id: '3', name: 'คุณจิ๋ว', phone: '0834567890' },
];

const timeSlots = generateTimeSlots(9, 20, 30);

export default function NewBookingPage() {
  const router = useRouter();
  const { services, bookings, addBooking, fetchServices, fetchBookings } = useBookingStore();
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, [fetchServices, fetchBookings]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [selectedZone, setSelectedZone] = useState<'hair' | 'nail' | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof existingCustomers[0] | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [channel, setChannel] = useState<'walk-in' | 'line' | 'web'>('walk-in');

  // Filter services by zone (only active services)
  const hairServices = services.filter(s => s.zone === 'hair' && s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const nailServices = services.filter(s => s.zone === 'nail' && s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const filteredServices = selectedZone === 'hair' ? hairServices : selectedZone === 'nail' ? nailServices : [];

  // Total duration
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Get unavailable times
  const unavailableTimes = selectedDate && selectedZone && totalDuration > 0
    ? getUnavailableTimes(bookings, selectedDate, selectedZone, totalDuration)
    : [];

  // Filter customers by search
  const filteredCustomers = customerSearch
    ? existingCustomers.filter(
        c => c.name.includes(customerSearch) || c.phone.includes(customerSearch)
      )
    : [];

  // Toggle service selection
  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
    setSelectedTime(''); // Reset time when services change
  };

  // Validate phone
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

  // Handle submit
  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      // Validate phone for new customer
      if (isNewCustomer && !validatePhone(newCustomerPhone)) {
        setIsLoading(false);
        return;
      }

      // Re-check time slot availability
      if (selectedZone && totalDuration > 0) {
        const available = isTimeSlotAvailable(bookings, selectedDate, selectedTime, selectedZone, totalDuration);
        if (!available) {
          setSubmitError('ขออภัย เวลานี้ถูกจองไปแล้ว กรุณาเลือกเวลาอื่น');
          setIsLoading(false);
          setStep(2);
          return;
        }
      }

      // Add booking
      const bookingId = await addBooking({
        services: selectedServices,
        totalDuration,
        zone: selectedZone!,
        date: selectedDate,
        time: selectedTime,
        customerName: selectedCustomer?.name || newCustomerName,
        customerPhone: selectedCustomer?.phone || newCustomerPhone,
        notes: notes || undefined,
        status: 'confirmed',
        channel,
      });

      if (!bookingId) {
        setSubmitError('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่');
        return;
      }

      router.push('/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid
  const isStep1Valid = selectedServices.length > 0;
  const isStep2Valid = selectedDate && selectedTime;
  const isStep3Valid = selectedCustomer || (newCustomerName && newCustomerPhone && isValidThaiPhone(newCustomerPhone));

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="จองคิวใหม่" 
        showBack 
        backHref="/bookings"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s 
                  ? 'bg-primary text-white' 
                  : 'bg-beige-100 text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 mx-1 rounded ${
                step > s ? 'bg-primary' : 'bg-beige-100'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">เลือกบริการ</h2>
          
          {/* Zone Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setSelectedZone('hair');
                setSelectedServices([]);
              }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedZone === 'hair'
                  ? 'border-primary bg-pink-50'
                  : 'border-border hover:border-pink-200'
              }`}
            >
              <Scissors className="w-10 h-10 mx-auto text-pink-500 mb-2" />
              <p className="font-semibold text-lg">โซนผม</p>
              <p className="text-sm text-muted-foreground">{hairServices.length} บริการ</p>
            </button>
            
            <button
              onClick={() => {
                setSelectedZone('nail');
                setSelectedServices([]);
              }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedZone === 'nail'
                  ? 'border-primary bg-beige-50'
                  : 'border-border hover:border-beige-200'
              }`}
            >
              <Sparkles className="w-10 h-10 mx-auto text-beige-400 mb-2" />
              <p className="font-semibold text-lg">โซนเล็บ</p>
              <p className="text-sm text-muted-foreground">{nailServices.length} บริการ</p>
            </button>
          </div>

          {/* Services */}
          {selectedZone && (
            <div className="space-y-2 mt-4">
              <p className="text-muted-foreground">
                {selectedZone === 'nail' ? 'เลือกบริการ (เลือกได้หลายรายการ)' : 'เลือกบริการ'}
              </p>
              {filteredServices.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (selectedZone === 'hair') {
                        setSelectedServices([service]);
                      } else {
                        toggleService(service);
                      }
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-pink-50'
                        : 'border-border hover:border-pink-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ⏱️ {service.duration} นาที
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

          {/* Selected Summary */}
          {selectedServices.length > 0 && (
            <Card className="bg-gradient-to-r from-pink-50 to-beige-50">
              <p className="font-semibold mb-2">บริการที่เลือก ({selectedServices.length})</p>
              <div className="space-y-1">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
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

          <Button 
            onClick={() => setStep(2)} 
            disabled={!isStep1Valid}
            className="w-full mt-4"
          >
            ถัดไป
          </Button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">เลือกวันและเวลา</h2>
          
          <Card>
            <div className="flex items-center gap-3 mb-2">
              {selectedZone === 'hair' 
                ? <Scissors className="w-6 h-6 text-pink-500" />
                : <Sparkles className="w-6 h-6 text-beige-400" />
              }
              <div>
                <p className="font-semibold">
                  {selectedServices.length === 1 
                    ? selectedServices[0].name 
                    : `${selectedServices.length} บริการ`}
                </p>
                <p className="text-sm text-muted-foreground">
                  ⏱️ รวม {totalDuration} นาที
                </p>
              </div>
            </div>
          </Card>

          {submitError && (
            <Card className="bg-red-50 border-2 border-red-300">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{submitError}</p>
              </div>
            </Card>
          )}

          <Input
            type="date"
            label="วันที่"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime('');
            }}
            min={getTodayString()}
            leftIcon={<Calendar className="w-5 h-5" />}
          />

          {selectedDate && (
            <div>
              <label className="block text-base font-semibold text-foreground mb-2">
                เวลา
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {timeSlots.map((time) => {
                  const isUnavailable = unavailableTimes.includes(time);
                  return (
                    <button
                      key={time}
                      onClick={() => !isUnavailable && setSelectedTime(time)}
                      disabled={isUnavailable}
                      className={`py-3 px-2 rounded-xl text-center font-medium transition-all ${
                        selectedTime === time
                          ? 'bg-primary text-white'
                          : isUnavailable
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                          : 'bg-beige-50 hover:bg-beige-100'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * เวลาที่ขีดฆ่าคือเวลาที่ไม่ว่าง
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              ย้อนกลับ
            </Button>
            <Button onClick={() => setStep(3)} disabled={!isStep2Valid} className="flex-1">
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Info */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">ข้อมูลลูกค้า</h2>

          {/* Channel Selection */}
          <div>
            <label className="block text-base font-semibold text-foreground mb-2">
              ช่องทาง
            </label>
            <div className="flex gap-2">
              {[
                { value: 'walk-in', label: 'Walk-in' },
                { value: 'line', label: 'LINE' },
                { value: 'web', label: 'เว็บไซต์' },
              ].map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value as typeof channel)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                    channel === ch.value
                      ? 'bg-primary text-white'
                      : 'bg-beige-50 hover:bg-beige-100'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Existing Customer */}
          {!isNewCustomer && (
            <>
              <Input
                placeholder="ค้นหาลูกค้า (ชื่อ/เบอร์โทร)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />

              {filteredCustomers.length > 0 && (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch('');
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedCustomer?.id === customer.id
                          ? 'border-primary bg-pink-50'
                          : 'border-border hover:border-pink-200'
                      }`}
                    >
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <Card className="bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold">{selectedCustomer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </Card>
              )}

              <button
                onClick={() => setIsNewCustomer(true)}
                className="flex items-center gap-2 text-primary font-medium"
              >
                <Plus className="w-5 h-5" />
                เพิ่มลูกค้าใหม่
              </button>
            </>
          )}

          {/* New Customer Form */}
          {isNewCustomer && (
            <div className="space-y-4">
              <button
                onClick={() => setIsNewCustomer(false)}
                className="text-primary font-medium"
              >
                ← ค้นหาลูกค้าเดิม
              </button>

              <Input
                label="ชื่อลูกค้า"
                placeholder="ชื่อ-นามสกุล"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                leftIcon={<User className="w-5 h-5" />}
              />

              <div>
                <Input
                  label="เบอร์โทรศัพท์"
                  placeholder="08X-XXX-XXXX"
                  value={newCustomerPhone}
                  onChange={(e) => {
                    setNewCustomerPhone(e.target.value);
                    if (phoneError) validatePhone(e.target.value);
                  }}
                  onBlur={() => validatePhone(newCustomerPhone)}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
                {phoneError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-base font-semibold text-foreground mb-2">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น แพ้สารเคมี, ต้องการช่างคนเดิม..."
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none resize-none h-24"
            />
          </div>

          {/* Summary */}
          <Card className="bg-beige-50">
            <h3 className="font-semibold mb-3">สรุปการจอง</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">บริการ</span>
                <span className="font-medium">
                  {selectedServices.length === 1 
                    ? selectedServices[0].name 
                    : `${selectedServices.length} บริการ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ระยะเวลา</span>
                <span className="font-medium">{totalDuration} นาที</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันที่</span>
                <span className="font-medium">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เวลา</span>
                <span className="font-medium">{selectedTime} น.</span>
              </div>
            </div>
          </Card>

          {submitError && (
            <Card className="bg-red-50 border-2 border-red-300">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{submitError}</p>
              </div>
            </Card>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
              ย้อนกลับ
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isStep3Valid}
              isLoading={isLoading}
              className="flex-1"
            >
              ยืนยันการจอง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
