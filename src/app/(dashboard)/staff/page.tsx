'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Phone,
  Edit,
  ToggleLeft,
  ToggleRight,
  User,
  Crown,
  Scissors,
  Sparkles,
  Loader2,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Badge, Button, Input, Avatar, Modal } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatPhone, getRoleText, formatLocalDate, getTodayString } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBookingStore, type Staff } from '@/lib/store';

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="w-4 h-4 text-amber-500" />,
  manager: <User className="w-4 h-4 text-blue-500" />,
  hair: <Scissors className="w-4 h-4 text-pink-500" />,
  nail: <Sparkles className="w-4 h-4 text-beige-400" />,
  reception: <User className="w-4 h-4 text-green-500" />,
};

const roleBadgeVariants: Record<string, 'warning' | 'info' | 'hair' | 'nail' | 'success'> = {
  owner: 'warning',
  manager: 'info',
  hair: 'hair',
  nail: 'nail',
  reception: 'success',
};

// Local Staff type for form (with snake_case for DB)
interface LocalStaff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  salary_base: number;
  commission_enabled: boolean;
  is_active: boolean;
}

export default function StaffPage() {
  const { 
    staffSchedules, 
    fetchStaffSchedules, 
    addStaffDayOff, 
    removeStaffDayOff,
    getStaffDaysOff,
    fetchStaff: fetchStaffToStore
  } = useBookingStore();
  
  const [staff, setStaff] = useState<LocalStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<LocalStaff | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<LocalStaff | null>(null);

  // Fetch staff from Supabase
  useEffect(() => {
    fetchStaff();
    fetchStaffSchedules();
    fetchStaffToStore(); // Also fetch to store for getZoneCapacity
  }, [fetchStaffSchedules, fetchStaffToStore]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter staff
  const filteredStaff = staff
    .filter((s) => 
      (showInactive || s.is_active) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.phone.includes(searchQuery.replace(/-/g, '')))
    );

  // Toggle staff active status
  const toggleStaffStatus = async (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (!staffMember) return;

    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !staffMember.is_active })
        .eq('id', id);

      if (error) throw error;

      setStaff(staff.map(s => 
        s.id === id ? { ...s, is_active: !s.is_active } : s
      ));
      // Update store for getZoneCapacity
      fetchStaffToStore();
    } catch (error) {
      console.error('Error toggling staff status:', error);
    }
  };

  const handleEdit = (staffMember: LocalStaff) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleSchedule = (staffMember: LocalStaff) => {
    setSelectedStaff(staffMember);
    setIsScheduleModalOpen(true);
  };

  const handleSave = async (staffData: Omit<LocalStaff, 'id' | 'is_active'>) => {
    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', editingStaff.id);

        if (error) throw error;

        setStaff(staff.map(s => 
          s.id === editingStaff.id 
            ? { ...s, ...staffData }
            : s
        ));
      } else {
        // Add new staff
        const { data, error } = await supabase
          .from('staff')
          .insert({ ...staffData, is_active: true })
          .select()
          .single();

        if (error) throw error;

        setStaff([...staff, data]);
      }
      setIsModalOpen(false);
      // Update store for getZoneCapacity
      fetchStaffToStore();
    } catch (error: unknown) {
      console.error('Error saving staff:', error);
      const err = error as { message?: string; code?: string };
      const errorMessage = err?.message || err?.code || JSON.stringify(error);
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    }
  };

  const activeCount = staff.filter(s => s.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="พนักงาน" 
        subtitle={`${activeCount} คน`}
        rightContent={
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="w-5 h-5" />
            เพิ่ม
          </Button>
        }
      />

      {/* Search */}
      <Input
        placeholder="ค้นหาชื่อหรือเบอร์โทร..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Show Inactive Toggle */}
      <div className="flex items-center justify-between p-3 bg-beige-50 rounded-xl">
        <span className="font-medium">แสดงพนักงานที่ปิดใช้งาน</span>
        <button onClick={() => setShowInactive(!showInactive)}>
          {showInactive ? (
            <ToggleRight className="w-8 h-8 text-primary" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Empty State */}
      {staff.length === 0 && (
        <Card className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">ยังไม่มีพนักงาน</p>
          <p className="text-muted-foreground mb-4">เพิ่มพนักงานคนแรกของร้านเลย</p>
          <Button onClick={handleAddNew}>
            <Plus className="w-5 h-5" />
            เพิ่มพนักงาน
          </Button>
        </Card>
      )}

      {/* Staff List */}
      <div className="space-y-3">
        {filteredStaff.map((staffMember) => {
          const daysOff = getStaffDaysOff(staffMember.id);
          const upcomingDaysOff = daysOff.filter(d => d >= getTodayString()).length;
          
          return (
            <Card 
              key={staffMember.id}
              className={`transition-opacity ${!staffMember.is_active ? 'opacity-50' : ''}`}
              padding="md"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar name={staffMember.name} size="lg" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg">{staffMember.name}</p>
                    <Badge variant={roleBadgeVariants[staffMember.role] || 'info'} size="sm">
                      {roleIcons[staffMember.role]}
                      <span className="ml-1">{getRoleText(staffMember.role)}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {formatPhone(staffMember.phone)}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>เงินเดือน: <strong>{formatCurrency(staffMember.salary_base)}</strong></span>
                    {upcomingDaysOff > 0 && (
                      <span className="text-orange-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        วันหยุด {upcomingDaysOff} วัน
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSchedule(staffMember)}
                    className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
                    title="จัดการวันหยุด"
                  >
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </button>
                  <button
                    onClick={() => handleEdit(staffMember)}
                    className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-muted-foreground" />
                  </button>
                  {staffMember.role !== 'owner' && (
                    <button
                      onClick={() => toggleStaffStatus(staffMember.id)}
                      className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
                    >
                      {staffMember.is_active ? (
                        <ToggleRight className="w-6 h-6 text-success" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
      >
        <StaffForm 
          staff={editingStaff}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`จัดการวันหยุด - ${selectedStaff?.name || ''}`}
      >
        {selectedStaff && (
          <ScheduleCalendar
            staffId={selectedStaff.id}
            staffName={selectedStaff.name}
            onClose={() => setIsScheduleModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

// Staff Form Component
function StaffForm({ 
  staff, 
  onSave, 
  onCancel 
}: { 
  staff: LocalStaff | null;
  onSave: (data: Omit<LocalStaff, 'id' | 'is_active'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(staff?.name || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [role, setRole] = useState(staff?.role || 'hair');
  const [salaryBase, setSalaryBase] = useState(staff?.salary_base?.toString() || '');
  const [commissionEnabled, setCommissionEnabled] = useState(staff?.commission_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { value: 'owner', label: 'เจ้าของร้าน', icon: <Crown className="w-5 h-5" /> },
    { value: 'manager', label: 'ผู้จัดการ', icon: <User className="w-5 h-5" /> },
    { value: 'hair', label: 'ช่างทำผม', icon: <Scissors className="w-5 h-5" /> },
    { value: 'nail', label: 'ช่างทำเล็บ', icon: <Sparkles className="w-5 h-5" /> },
    { value: 'reception', label: 'พนักงานต้อนรับ', icon: <User className="w-5 h-5" /> },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    
    setIsSaving(true);
    await onSave({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim() || null,
      role,
      salary_base: parseInt(salaryBase) || 0,
      commission_enabled: commissionEnabled,
    });
    setIsSaving(false);
  };

  const isValid = name.trim() && phone.trim();

  return (
    <div className="space-y-4">
      <Input
        label="ชื่อ-นามสกุล"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อพนักงาน"
        leftIcon={<User className="w-5 h-5" />}
      />

      <Input
        label="เบอร์โทรศัพท์"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="08X-XXX-XXXX"
        leftIcon={<Phone className="w-5 h-5" />}
      />

      <div>
        <label className="block text-base font-semibold text-foreground mb-2">
          ตำแหน่ง
        </label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-colors ${
                role === r.value 
                  ? 'border-primary bg-pink-50' 
                  : 'border-border hover:border-pink-200'
              }`}
            >
              {r.icon}
              <span className="font-medium text-sm">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="เงินเดือน (บาท)"
        type="number"
        value={salaryBase}
        onChange={(e) => setSalaryBase(e.target.value)}
        placeholder="15000"
      />

      <div className="flex items-center justify-between p-4 bg-beige-50 rounded-xl">
        <div>
          <p className="font-semibold">รับคอมมิชชั่น</p>
          <p className="text-sm text-muted-foreground">เปิดรับค่าคอมจากบริการ</p>
        </div>
        <button type="button" onClick={() => setCommissionEnabled(!commissionEnabled)}>
          {commissionEnabled ? (
            <ToggleRight className="w-10 h-10 text-success" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={isSaving}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || isSaving} isLoading={isSaving} className="flex-1">
          บันทึก
        </Button>
      </div>
    </div>
  );
}

// Schedule Calendar Component
function ScheduleCalendar({ 
  staffId, 
  staffName,
  onClose 
}: { 
  staffId: string;
  staffName: string;
  onClose: () => void;
}) {
  const { staffSchedules, addStaffDayOff, removeStaffDayOff } = useBookingStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Get days off for this staff
  const daysOff = useMemo(() => {
    return staffSchedules
      .filter(s => s.staffId === staffId && s.isDayOff)
      .map(s => s.date);
  }, [staffSchedules, staffId]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  const formatDateString = (date: Date) => {
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDayOff = (date: Date) => {
    return daysOff.includes(formatDateString(date));
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const toggleDayOff = async (date: Date) => {
    if (isPastDate(date)) return;
    
    const dateString = formatDateString(date);
    setIsLoading(true);
    
    try {
      if (isDateDayOff(date)) {
        await removeStaffDayOff(staffId, dateString);
      } else {
        await addStaffDayOff(staffId, dateString);
      }
    } catch (error) {
      console.error('Error toggling day off:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        กดเลือกวันที่ต้องการให้ <strong>{staffName}</strong> หยุด
      </p>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-beige-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-beige-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const isDayOff = isDateDayOff(date);
          const isPast = isPastDate(date);
          const isToday = formatDateString(date) === formatDateString(new Date());
          
          return (
            <button
              key={index}
              onClick={() => toggleDayOff(date)}
              disabled={isPast || isLoading || !isCurrentMonth}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isPast && isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
                ${isToday ? 'ring-2 ring-primary' : ''}
                ${isDayOff && isCurrentMonth ? 'bg-orange-500 text-white' : ''}
                ${!isDayOff && isCurrentMonth && !isPast ? 'hover:bg-beige-100' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span>วันหยุด</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-beige-100 border"></div>
          <span>วันทำงาน</span>
        </div>
      </div>

      {/* Days Off Summary */}
      {daysOff.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="font-semibold text-orange-800 mb-2">
            วันหยุดที่เลือก ({daysOff.filter(d => d >= formatDateString(new Date())).length} วัน)
          </p>
          <div className="flex flex-wrap gap-2">
            {daysOff
              .filter(d => d >= formatDateString(new Date()))
              .sort()
              .slice(0, 10)
              .map(date => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-sm"
                >
                  {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  <button
                    onClick={() => removeStaffDayOff(staffId, date)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            {daysOff.filter(d => d >= formatDateString(new Date())).length > 10 && (
              <span className="text-sm text-muted-foreground">
                +{daysOff.filter(d => d >= formatDateString(new Date())).length - 10} วัน
              </span>
            )}
          </div>
        </div>
      )}

      <Button onClick={onClose} className="w-full">
        เสร็จสิ้น
      </Button>
    </div>
  );
}
