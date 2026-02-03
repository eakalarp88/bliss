'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Settings,
  Users,
  Receipt,
  TrendingUp,
  Calendar,
  ChevronRight,
  Percent,
  DollarSign,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calculator,
  Scissors,
  Sparkles
} from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, getRoleText } from '@/lib/utils';

// Mock commission rules
const mockRules = [
  { 
    id: '1', 
    rule_name: 'คอมมิชชั่นช่างผม 10%', 
    staff_role: 'hair',
    service_id: null,
    commission_type: 'percentage' as const,
    value: 10,
    effective_from: '2025-01-01',
    effective_to: null,
    is_active: true
  },
  { 
    id: '2', 
    rule_name: 'คอมมิชชั่นช่างเล็บ 15%', 
    staff_role: 'nail',
    service_id: null,
    commission_type: 'percentage' as const,
    value: 15,
    effective_from: '2025-01-01',
    effective_to: null,
    is_active: true
  },
  { 
    id: '3', 
    rule_name: 'โบนัสทำสีผม', 
    staff_role: 'hair',
    service_id: '3',
    service_name: 'ทำสีผม',
    commission_type: 'fixed' as const,
    value: 100,
    effective_from: '2025-01-01',
    effective_to: '2025-03-31',
    is_active: true
  },
];

// Mock staff commissions this month
const mockStaffCommissions = [
  { staff_id: '1', staff_name: 'พี่หมู', role: 'hair', total_revenue: 45000, commission: 4500, bills_count: 38 },
  { staff_id: '2', staff_name: 'พี่แอน', role: 'nail', total_revenue: 38500, commission: 5775, bills_count: 52 },
  { staff_id: '3', staff_name: 'พี่เอ', role: 'hair', total_revenue: 32000, commission: 3200, bills_count: 28 },
  { staff_id: '4', staff_name: 'น้องมิ้ว', role: 'nail', total_revenue: 29500, commission: 4425, bills_count: 45 },
];

// Mock services for dropdown
const mockServices = [
  { value: '', label: 'ทุกบริการ' },
  { value: '1', label: 'ตัดผม' },
  { value: '2', label: 'สระไดร์' },
  { value: '3', label: 'ทำสีผม' },
  { value: '4', label: 'ดัดผม' },
  { value: '5', label: 'ทำเล็บเจล' },
  { value: '6', label: 'ทำเล็บสีธรรมดา' },
  { value: '7', label: 'ต่อเล็บ' },
  { value: '8', label: 'สปาเท้า' },
];

type Tab = 'rules' | 'payouts';

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rules');
  const [rules, setRules] = useState(mockRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<typeof mockRules[0] | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('2025-01');

  // Calculate totals
  const totalCommissionThisMonth = mockStaffCommissions.reduce((sum, s) => sum + s.commission, 0);

  // Toggle rule status
  const toggleRuleStatus = (id: string) => {
    setRules(rules.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    ));
  };

  // Delete rule
  const deleteRule = (id: string) => {
    if (confirm('ต้องการลบกฎนี้ใช่หรือไม่?')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  // Open edit modal
  const handleEdit = (rule: typeof mockRules[0]) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  // Open add modal
  const handleAddNew = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="คอมมิชชั่น" 
        rightContent={
          activeTab === 'rules' && (
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="w-5 h-5" />
              เพิ่มกฎ
            </Button>
          )
        }
      />

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="text-center py-2">
          <p className="text-muted-foreground">คอมมิชชั่นที่ต้องจ่ายเดือนนี้</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {formatCurrency(totalCommissionThisMonth)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {mockStaffCommissions.length} คน
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-primary text-white'
              : 'bg-beige-100 text-foreground hover:bg-beige-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          กฎคอมมิชชั่น
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'payouts'
              ? 'bg-primary text-white'
              : 'bg-beige-100 text-foreground hover:bg-beige-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          ยอดค้างจ่าย
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            กฎที่ใช้งานอยู่ {rules.filter(r => r.is_active).length} กฎ
          </p>

          {rules.map((rule) => (
            <Card 
              key={rule.id}
              className={`transition-opacity ${!rule.is_active ? 'opacity-50' : ''}`}
              padding="md"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  rule.commission_type === 'percentage' 
                    ? 'bg-blue-100' 
                    : 'bg-green-100'
                }`}>
                  {rule.commission_type === 'percentage' ? (
                    <Percent className="w-6 h-6 text-blue-500" />
                  ) : (
                    <DollarSign className="w-6 h-6 text-green-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg">{rule.rule_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge 
                      variant={rule.staff_role === 'hair' ? 'hair' : 'nail'}
                      size="sm"
                    >
                      {rule.staff_role === 'hair' ? '💇 ช่างผม' : '💅 ช่างเล็บ'}
                    </Badge>
                    {rule.service_id && (
                      <Badge variant="info" size="sm">
                        {(rule as any).service_name || 'บริการเฉพาะ'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {rule.commission_type === 'percentage' 
                      ? `${rule.value}% ของราคาบริการ`
                      : `${formatCurrency(rule.value)} ต่อครั้ง`
                    }
                  </p>
                  {rule.effective_to && (
                    <p className="text-xs text-warning mt-1">
                      ⏰ หมดอายุ: {new Date(rule.effective_to).toLocaleDateString('th-TH')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
                  >
                    {rule.is_active ? (
                      <ToggleRight className="w-6 h-6 text-success" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card className="text-center py-8">
              <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">ยังไม่มีกฎคอมมิชชั่น</p>
              <p className="text-muted-foreground mb-4">เพิ่มกฎเพื่อคำนวณคอมมิชชั่นให้พนักงาน</p>
              <Button onClick={handleAddNew}>
                <Plus className="w-5 h-5" />
                เพิ่มกฎใหม่
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Staff Commission List */}
          <div className="space-y-3">
            {mockStaffCommissions.map((staff, index) => (
              <Card key={staff.staff_id} padding="md">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-amber-400 text-white' :
                    index === 1 ? 'bg-gray-300 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-beige-100 text-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{staff.staff_name}</p>
                      <Badge 
                        variant={staff.role === 'hair' ? 'hair' : 'nail'}
                        size="sm"
                      >
                        {staff.role === 'hair' ? '💇' : '💅'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>รายได้: {formatCurrency(staff.total_revenue)}</span>
                      <span>{staff.bills_count} บิล</span>
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(staff.commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">คอมมิชชั่น</p>
                  </div>
                </div>

                {/* Progress bar showing percentage */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>อัตราคอม</span>
                    <span>{((staff.commission / staff.total_revenue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-beige-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                      style={{ width: `${(staff.commission / staff.total_revenue) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Total */}
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">รวมทั้งหมด</p>
                <p className="text-sm text-muted-foreground">
                  {mockStaffCommissions.length} คน
                </p>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalCommissionThisMonth)}
              </p>
            </div>
          </Card>

          {/* Recalculate Button */}
          <Button variant="secondary" className="w-full">
            <Calculator className="w-5 h-5" />
            คำนวณใหม่
          </Button>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'แก้ไขกฎคอมมิชชั่น' : 'เพิ่มกฎคอมมิชชั่นใหม่'}
      >
        <CommissionRuleForm
          rule={editingRule}
          services={mockServices}
          onSave={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// Commission Rule Form
function CommissionRuleForm({
  rule,
  services,
  onSave,
  onCancel,
}: {
  rule: typeof mockRules[0] | null;
  services: { value: string; label: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [ruleName, setRuleName] = useState(rule?.rule_name || '');
  const [staffRole, setStaffRole] = useState(rule?.staff_role || 'hair');
  const [serviceId, setServiceId] = useState(rule?.service_id || '');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>(
    rule?.commission_type || 'percentage'
  );
  const [value, setValue] = useState(rule?.value?.toString() || '');
  const [effectiveFrom, setEffectiveFrom] = useState(
    rule?.effective_from || new Date().toISOString().split('T')[0]
  );
  const [effectiveTo, setEffectiveTo] = useState(rule?.effective_to || '');

  const handleSubmit = () => {
    // TODO: Save to Supabase
    console.log({
      ruleName,
      staffRole,
      serviceId,
      commissionType,
      value,
      effectiveFrom,
      effectiveTo,
    });
    onSave();
  };

  return (
    <div className="space-y-4">
      <Input
        label="ชื่อกฎ"
        value={ruleName}
        onChange={(e) => setRuleName(e.target.value)}
        placeholder="เช่น คอมมิชชั่นช่างผม 10%"
      />

      {/* Staff Role */}
      <div>
        <label className="block text-base font-semibold text-foreground mb-2">
          ตำแหน่งที่ใช้กฎนี้
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setStaffRole('hair')}
            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              staffRole === 'hair'
                ? 'border-primary bg-pink-50'
                : 'border-border hover:border-pink-200'
            }`}
          >
            <Scissors className="w-5 h-5 text-pink-500" />
            <span className="font-medium">ช่างผม</span>
          </button>
          <button
            onClick={() => setStaffRole('nail')}
            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              staffRole === 'nail'
                ? 'border-primary bg-beige-50'
                : 'border-border hover:border-beige-200'
            }`}
          >
            <Sparkles className="w-5 h-5 text-beige-400" />
            <span className="font-medium">ช่างเล็บ</span>
          </button>
        </div>
      </div>

      {/* Service (Optional) */}
      <Select
        label="บริการ (ไม่บังคับ)"
        options={services}
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        hint="เลือกเฉพาะบริการ หรือเว้นว่างเพื่อใช้กับทุกบริการ"
      />

      {/* Commission Type */}
      <div>
        <label className="block text-base font-semibold text-foreground mb-2">
          ประเภทคอมมิชชั่น
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCommissionType('percentage')}
            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              commissionType === 'percentage'
                ? 'border-primary bg-blue-50'
                : 'border-border hover:border-blue-200'
            }`}
          >
            <Percent className="w-5 h-5 text-blue-500" />
            <span className="font-medium">เปอร์เซ็นต์</span>
          </button>
          <button
            onClick={() => setCommissionType('fixed')}
            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              commissionType === 'fixed'
                ? 'border-primary bg-green-50'
                : 'border-border hover:border-green-200'
            }`}
          >
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-medium">จำนวนเงินคงที่</span>
          </button>
        </div>
      </div>

      {/* Value */}
      <Input
        label={commissionType === 'percentage' ? 'เปอร์เซ็นต์ (%)' : 'จำนวนเงิน (บาท)'}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={commissionType === 'percentage' ? '10' : '100'}
        hint={commissionType === 'percentage' 
          ? 'เช่น 10 หมายถึง 10% ของราคาบริการ'
          : 'จำนวนเงินที่ได้ต่อการให้บริการ 1 ครั้ง'
        }
      />

      {/* Effective Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="เริ่มใช้"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
        />
        <Input
          label="สิ้นสุด (ไม่บังคับ)"
          type="date"
          value={effectiveTo}
          onChange={(e) => setEffectiveTo(e.target.value)}
          hint="เว้นว่างถ้าไม่มีวันหมดอายุ"
        />
      </div>

      {/* Preview */}
      <Card className="bg-beige-50">
        <p className="text-sm font-semibold mb-2">ตัวอย่าง:</p>
        <p className="text-muted-foreground">
          {staffRole === 'hair' ? 'ช่างผม' : 'ช่างเล็บ'} จะได้รับ{' '}
          <strong className="text-foreground">
            {commissionType === 'percentage' 
              ? `${value || '0'}% ของราคาบริการ`
              : `${formatCurrency(Number(value) || 0)} ต่อครั้ง`
            }
          </strong>
          {serviceId ? ' (เฉพาะบริการที่เลือก)' : ' (ทุกบริการ)'}
        </p>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          บันทึก
        </Button>
      </div>
    </div>
  );
}
