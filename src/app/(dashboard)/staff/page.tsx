'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone,
  Mail,
  Edit,
  ToggleLeft,
  ToggleRight,
  User,
  Crown,
  Scissors,
  Sparkles
} from 'lucide-react';
import { Card, Badge, Button, Input, Avatar, Modal } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatPhone, getRoleText } from '@/lib/utils';

// Staff type
interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  salary_base: number;
  commission_enabled: boolean;
  is_active: boolean;
}

// Mock staff data
const initialStaff: Staff[] = [
  { id: '1', name: 'คุณชมพู', phone: '0891234567', email: 'owner@bliss.com', role: 'owner', salary_base: 0, commission_enabled: false, is_active: true },
  { id: '2', name: 'คุณเบท', phone: '0891234568', email: 'manager@bliss.com', role: 'manager', salary_base: 25000, commission_enabled: true, is_active: true },
  { id: '3', name: 'พี่หมู', phone: '0891234569', email: null, role: 'hair', salary_base: 18000, commission_enabled: true, is_active: true },
  { id: '4', name: 'พี่แอน', phone: '0891234570', email: null, role: 'nail', salary_base: 18000, commission_enabled: true, is_active: true },
  { id: '5', name: 'พี่เอ', phone: '0891234571', email: null, role: 'hair', salary_base: 18000, commission_enabled: true, is_active: true },
  { id: '6', name: 'น้องมิว', phone: '0891234572', email: null, role: 'reception', salary_base: 15000, commission_enabled: false, is_active: true },
  { id: '7', name: 'น้องมิ้ว', phone: '0891234573', email: null, role: 'nail', salary_base: 16000, commission_enabled: true, is_active: false },
];

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

export default function StaffPage() {
  const [staff, setStaff] = useState(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Filter staff
  const filteredStaff = staff
    .filter((s) => 
      (showInactive || s.is_active) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.phone.includes(searchQuery.replace(/-/g, '')))
    );

  // Toggle staff active status
  const toggleStaffStatus = (id: string) => {
    setStaff(staff.map(s => 
      s.id === id ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleSave = (staffData: Omit<Staff, 'id' | 'is_active'>) => {
    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(s => 
        s.id === editingStaff.id 
          ? { ...s, ...staffData }
          : s
      ));
    } else {
      // Add new staff
      const newStaff: Staff = {
        ...staffData,
        id: `${Date.now()}`,
        is_active: true,
      };
      setStaff([...staff, newStaff]);
    }
    setIsModalOpen(false);
  };

  const activeCount = staff.filter(s => s.is_active).length;

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

      {/* Staff List */}
      <div className="space-y-3">
        {filteredStaff.map((staffMember) => (
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
                  <Badge variant={roleBadgeVariants[staffMember.role]} size="sm">
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
                  <span className={`flex items-center gap-1 ${
                    staffMember.commission_enabled ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    คอมมิชชั่น: {staffMember.commission_enabled ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
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
        ))}
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
    </div>
  );
}

// Staff Form Component
function StaffForm({ 
  staff, 
  onSave, 
  onCancel 
}: { 
  staff: Staff | null;
  onSave: (data: Omit<Staff, 'id' | 'is_active'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(staff?.name || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [role, setRole] = useState(staff?.role || 'hair');
  const [salaryBase, setSalaryBase] = useState(staff?.salary_base?.toString() || '');
  const [commissionEnabled, setCommissionEnabled] = useState(staff?.commission_enabled ?? true);

  const roles = [
    { value: 'hair', label: 'ช่างทำผม', icon: <Scissors className="w-5 h-5" /> },
    { value: 'nail', label: 'ช่างทำเล็บ', icon: <Sparkles className="w-5 h-5" /> },
    { value: 'reception', label: 'พนักงานต้อนรับ', icon: <User className="w-5 h-5" /> },
    { value: 'manager', label: 'ผู้จัดการ', icon: <User className="w-5 h-5" /> },
  ];

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;
    
    onSave({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim() || null,
      role,
      salary_base: parseInt(salaryBase) || 0,
      commission_enabled: commissionEnabled,
    });
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

      <Input
        label="อีเมล (ไม่บังคับ)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        leftIcon={<Mail className="w-5 h-5" />}
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
              <span className="font-medium">{r.label}</span>
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
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
          บันทึก
        </Button>
      </div>
    </div>
  );
}
