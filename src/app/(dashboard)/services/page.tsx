'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Scissors,
  Sparkles,
  Edit,
  ToggleLeft,
  ToggleRight,
  Clock,
  GripVertical
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal, Select } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { useBookingStore, type Service } from '@/lib/store';

// Drag & Drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Time options for select
const timeOptions = [
  { value: '08:00', label: '08:00' },
  { value: '08:30', label: '08:30' },
  { value: '09:00', label: '09:00' },
  { value: '09:30', label: '09:30' },
  { value: '10:00', label: '10:00' },
  { value: '10:30', label: '10:30' },
  { value: '11:00', label: '11:00' },
  { value: '11:30', label: '11:30' },
  { value: '12:00', label: '12:00' },
  { value: '12:30', label: '12:30' },
  { value: '13:00', label: '13:00' },
  { value: '13:30', label: '13:30' },
  { value: '14:00', label: '14:00' },
  { value: '14:30', label: '14:30' },
  { value: '15:00', label: '15:00' },
  { value: '15:30', label: '15:30' },
  { value: '16:00', label: '16:00' },
  { value: '16:30', label: '16:30' },
  { value: '17:00', label: '17:00' },
  { value: '17:30', label: '17:30' },
  { value: '18:00', label: '18:00' },
  { value: '18:30', label: '18:30' },
  { value: '19:00', label: '19:00' },
  { value: '19:30', label: '19:30' },
  { value: '20:00', label: '20:00' },
  { value: '20:30', label: '20:30' },
  { value: '21:00', label: '21:00' },
  { value: '21:30', label: '21:30' },
  { value: '22:00', label: '22:00' },
];

type Zone = 'all' | 'hair' | 'nail';

export default function ServicesPage() {
  const { services, updateService, addService, toggleServiceActive, reorderServices } = useBookingStore();
  const [filterZone, setFilterZone] = useState<Zone>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter services
  const filteredServices = services
    .filter((service) => 
      (filterZone === 'all' || service.zone === filterZone) &&
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Group by zone and sort by sortOrder
  const hairServices = filteredServices
    .filter(s => s.zone === 'hair')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const nailServices = filteredServices
    .filter(s => s.zone === 'nail')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Handle drag end for hair services
  const handleDragEndHair = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = hairServices.findIndex((s) => s.id === active.id);
      const newIndex = hairServices.findIndex((s) => s.id === over.id);
      const reorderedHair = arrayMove(hairServices, oldIndex, newIndex);
      reorderServices('hair', reorderedHair.map(s => s.id));
    }
  };

  // Handle drag end for nail services
  const handleDragEndNail = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = nailServices.findIndex((s) => s.id === active.id);
      const newIndex = nailServices.findIndex((s) => s.id === over.id);
      const reorderedNail = arrayMove(nailServices, oldIndex, newIndex);
      reorderServices('nail', reorderedNail.map(s => s.id));
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleSave = (serviceData: { 
    name: string; 
    zone: 'hair' | 'nail'; 
    duration: number;
    availableFrom: string;
    availableTo: string;
  }) => {
    if (editingService) {
      // Update existing service
      updateService(editingService.id, serviceData);
    } else {
      // Add new service
      const zoneServices = services.filter(s => s.zone === serviceData.zone);
      const maxOrder = zoneServices.length > 0 
        ? Math.max(...zoneServices.map(s => s.sortOrder)) 
        : 0;
      
      addService({
        ...serviceData,
        isActive: true,
        sortOrder: maxOrder + 1,
      });
    }
    setIsModalOpen(false);
  };

  const activeCount = services.filter(s => s.isActive).length;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <PageHeader 
        title="จัดการบริการ" 
        subtitle={`${activeCount} บริการ`}
        rightContent={
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="w-5 h-5" />
            เพิ่ม
          </Button>
        }
      />

      {/* Search */}
      <Input
        placeholder="ค้นหาบริการ..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Zone Filter */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'ทั้งหมด' },
          { value: 'hair', label: '💇 โซนผม' },
          { value: 'nail', label: '💅 โซนเล็บ' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterZone(tab.value as Zone)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filterZone === tab.value
                ? 'bg-primary text-white'
                : 'bg-beige-100 text-foreground hover:bg-beige-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <GripVertical className="w-4 h-4" />
        กดค้างแล้วลากเพื่อเรียงลำดับบริการ
      </p>

      {/* Hair Services */}
      {(filterZone === 'all' || filterZone === 'hair') && hairServices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scissors className="w-5 h-5 text-pink-500" />
            <h3 className="font-semibold text-lg">โซนผม</h3>
            <Badge variant="hair">{hairServices.length}</Badge>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndHair}
          >
            <SortableContext
              items={hairServices.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {hairServices.map((service) => (
                  <SortableServiceCard 
                    key={service.id} 
                    service={service} 
                    onToggle={() => toggleServiceActive(service.id)}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Nail Services */}
      {(filterZone === 'all' || filterZone === 'nail') && nailServices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-beige-400" />
            <h3 className="font-semibold text-lg">โซนเล็บ</h3>
            <Badge variant="nail">{nailServices.length}</Badge>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndNail}
          >
            <SortableContext
              items={nailServices.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {nailServices.map((service) => (
                  <SortableServiceCard 
                    key={service.id} 
                    service={service} 
                    onToggle={() => toggleServiceActive(service.id)}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}
      >
        <ServiceForm 
          service={editingService}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// Sortable Service Card Component
function SortableServiceCard({ 
  service, 
  onToggle, 
  onEdit 
}: { 
  service: Service;
  onToggle: () => void;
  onEdit: (service: Service) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`transition-all ${!service.isActive ? 'opacity-50' : ''} ${
          isDragging ? 'shadow-lg ring-2 ring-primary/30 bg-white' : ''
        }`}
        padding="md"
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="touch-none p-1 rounded hover:bg-beige-100 cursor-grab active:cursor-grabbing"
            aria-label="ลากเพื่อเรียงลำดับ"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{service.name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {service.duration} นาที
              </span>
              <span className="text-primary font-medium">
                {service.availableFrom} - {service.availableTo}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(service)}
              className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
            >
              <Edit className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
            >
              {service.isActive ? (
                <ToggleRight className="w-6 h-6 text-success" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Service Form Component
function ServiceForm({ 
  service, 
  onSave, 
  onCancel 
}: { 
  service: Service | null;
  onSave: (data: { 
    name: string; 
    zone: 'hair' | 'nail'; 
    duration: number;
    availableFrom: string;
    availableTo: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service?.name || '');
  const [zone, setZone] = useState<'hair' | 'nail'>(service?.zone || 'hair');
  const [duration, setDuration] = useState(service?.duration?.toString() || '60');
  const [availableFrom, setAvailableFrom] = useState(service?.availableFrom || '10:00');
  const [availableTo, setAvailableTo] = useState(service?.availableTo || '20:00');

  const handleSubmit = () => {
    if (!name.trim() || !duration) return;
    onSave({ 
      name: name.trim(), 
      zone, 
      duration: parseInt(duration),
      availableFrom,
      availableTo,
    });
  };

  const isValid = name.trim() && duration && availableFrom && availableTo;

  return (
    <div className="space-y-4">
      <Input
        label="ชื่อบริการ"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="เช่น ตัดผม, ทำเล็บเจล"
      />

      <div>
        <label className="block text-base font-semibold text-foreground mb-2">
          โซน
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setZone('hair')}
            className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
              zone === 'hair' 
                ? 'border-primary bg-pink-50' 
                : 'border-border hover:border-pink-200'
            }`}
          >
            <Scissors className="w-6 h-6 mx-auto text-pink-500" />
            <p className="font-medium mt-1">โซนผม</p>
          </button>
          <button
            type="button"
            onClick={() => setZone('nail')}
            className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
              zone === 'nail' 
                ? 'border-primary bg-beige-50' 
                : 'border-border hover:border-beige-200'
            }`}
          >
            <Sparkles className="w-6 h-6 mx-auto text-beige-400" />
            <p className="font-medium mt-1">โซนเล็บ</p>
          </button>
        </div>
      </div>

      <Input
        label="ระยะเวลา (นาที)"
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="60"
        hint="ระยะเวลาโดยประมาณในการทำบริการ"
      />

      {/* Available Time Section */}
      <div>
        <label className="block text-base font-semibold text-foreground mb-2">
          ช่วงเวลารับจอง
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          ลูกค้าจะเห็นเฉพาะเวลาที่จองได้ ไม่เห็นเวลาเปิด-ปิด
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            options={timeOptions}
            className="flex-1"
          />
          <span className="text-muted-foreground font-medium">ถึง</span>
          <Select
            value={availableTo}
            onChange={(e) => setAvailableTo(e.target.value)}
            options={timeOptions}
            className="flex-1"
          />
        </div>
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
