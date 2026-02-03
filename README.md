# Bliss - ระบบจัดการร้านทำผมและทำเล็บ 💅💇

ระบบจัดการร้านสปาแบบ Mobile-First Web App พัฒนาด้วย Next.js 15 + Tailwind CSS

## 🔗 Quick Links

| หน้า | URL | สำหรับ |
|------|-----|-------|
| **หน้าจองลูกค้า** | `/book` | ลูกค้าจองออนไลน์ |
| **หน้า Admin** | `/` | พนักงาน/เจ้าของ |

## ✨ Features

### 📅 ระบบจองคิว (Booking Engine)
- จองคิวล่วงหน้าได้ 30 วัน
- รองรับ Walk-in, LINE, Web
- แยกโซนผมและเล็บ
- ระบบมัดจำอัตโนมัติสำหรับโซนเล็บ

### 💰 ระบบบิลและชำระเงิน (Billing & Payments)
- ปิดบิลหน้างาน
- รองรับส่วนลด/โปรโมชั่น
- 1 บิลมีได้หลายบริการ
- แยกเงินมัดจำออกจากบิลจริง

### 👥 ระบบ CRM (Customer Management)
- เก็บประวัติลูกค้า
- ติดตาม No-show
- ดูยอดใช้จ่ายสะสม
- ระบบ VIP อัตโนมัติ

### 👨‍💼 ระบบพนักงาน (Staff Management)
- จัดการตำแหน่งและเงินเดือน
- เปิด/ปิดสิทธิ์คอมมิชชั่นรายคน
- PIN Login สำหรับพนักงาน

### 📊 Dashboard & Reports
- รายได้แยกโซน
- Top Staff by Revenue
- สถิติการจอง
- ลูกค้าใหม่/ประจำ

## 🚀 Getting Started

### 1. ติดตั้ง Dependencies

```bash
cd bliss
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` จาก `.env.local.example`:

```bash
cp .env.local.example .env.local
```

แก้ไข `.env.local` ใส่ค่า Supabase ของคุณ:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. สร้าง Database (Supabase)

1. สร้างโปรเจค Supabase ที่ [supabase.com](https://supabase.com)
2. ไปที่ SQL Editor
3. Copy และรัน `database/schema.sql`

### 4. รันโปรเจค

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ใน browser

## 📱 PWA Support

แอปรองรับการติดตั้งเป็น PWA:

1. เปิดแอปใน Chrome/Safari บนมือถือ
2. กด "Add to Home Screen"
3. ใช้งานได้เหมือน Native App

## 🎨 Design System

### Colors
- **Primary (Pink)**: `#F5A9B8`
- **Secondary (Beige)**: `#F5E6D3`
- **Background**: `#FFFAF7`

### Typography
- Font: Noto Sans Thai
- Base size: 18px (สำหรับผู้สูงอายุ)
- Touch targets: 48px minimum

## 📁 Project Structure

```
bliss/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login pages
│   │   └── (dashboard)/      # Main app pages
│   │       ├── bookings/
│   │       ├── customers/
│   │       ├── billing/
│   │       ├── staff/
│   │       ├── services/
│   │       ├── reports/
│   │       └── settings/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── booking/
│   │   └── billing/
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── index.ts          # TypeScript types
├── database/
│   └── schema.sql            # Supabase schema
└── public/
    └── manifest.json         # PWA manifest
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| Owner | ทุกอย่าง |
| Manager | Booking, Bill, Staff |
| Reception | Booking, Bill |
| Staff | ดูรายได้ตัวเอง |

## 📝 TODO

- [ ] เพิ่มระบบ Authentication
- [ ] เชื่อมต่อ LINE Official Account
- [ ] เพิ่มระบบแจ้งเตือน
- [ ] Export รายงานเป็น PDF/Excel
- [ ] เพิ่ม Commission Tier System

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State**: Zustand
- **Date**: date-fns

## 📄 License

MIT License - ใช้งานได้ฟรี

---

Made with 💕 for Bliss Salon
