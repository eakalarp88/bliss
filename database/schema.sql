-- ==========================================
-- BLISS - Database Schema for Supabase
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- MODULE 1: Services & Zone Management
-- ==========================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(255) NOT NULL,
    zone VARCHAR(20) NOT NULL CHECK (zone IN ('hair', 'nail')),
    default_duration INTEGER, -- in minutes, nullable
    default_price DECIMAL(10,2), -- nullable, can set later
    is_deposit_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample services
INSERT INTO services (service_name, zone, default_duration, default_price, is_deposit_required) VALUES
    ('ตัดผม', 'hair', 30, 200, false),
    ('สระไดร์', 'hair', 45, 150, false),
    ('ทำสีผม', 'hair', 120, 1500, false),
    ('ดัดผม', 'hair', 180, 2000, false),
    ('ยืดผม', 'hair', 150, 2500, false),
    ('ทำเล็บเจล', 'nail', 60, 500, true),
    ('ทำเล็บสีธรรมดา', 'nail', 45, 300, true),
    ('ต่อเล็บ', 'nail', 90, 800, true),
    ('สปาเท้า', 'nail', 60, 400, true),
    ('ทำเล็บเท้า', 'nail', 45, 350, true);

-- ==========================================
-- MODULE 8: Customers (CRM)
-- ==========================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    line_id VARCHAR(100),
    total_spent DECIMAL(12,2) DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for phone lookup
CREATE INDEX idx_customers_phone ON customers(phone);

-- ==========================================
-- MODULE 5: Staff & Payroll Profile
-- ==========================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'reception', 'hair', 'nail')),
    salary_base DECIMAL(10,2) DEFAULT 0,
    commission_enabled BOOLEAN DEFAULT true,
    pin_code VARCHAR(4) NOT NULL, -- 4-digit PIN for quick login
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for PIN
CREATE UNIQUE INDEX idx_staff_pin ON staff(pin_code) WHERE is_active = true;

-- Sample staff
INSERT INTO staff (name, phone, role, salary_base, commission_enabled, pin_code) VALUES
    ('คุณชมพู (Owner)', '0891234567', 'owner', 0, false, '1234'),
    ('คุณเบท (Manager)', '0891234568', 'manager', 25000, true, '5678'),
    ('พี่หมู', '0891234569', 'hair', 18000, true, '1111'),
    ('พี่แอน', '0891234570', 'nail', 18000, true, '2222'),
    ('น้องมิว (Reception)', '0891234571', 'reception', 15000, false, '3333');

-- ==========================================
-- MODULE 2: Booking Engine
-- ==========================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    service_id UUID NOT NULL REFERENCES services(id),
    zone VARCHAR(20) NOT NULL CHECK (zone IN ('hair', 'nail')),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no-show')),
    channel VARCHAR(20) DEFAULT 'walk-in' CHECK (channel IN ('web', 'line', 'walk-in')),
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    deposit_status VARCHAR(20) DEFAULT 'not_required' CHECK (deposit_status IN ('pending', 'paid', 'refunded', 'not_required')),
    reschedule_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for booking queries
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_zone ON bookings(zone);

-- ==========================================
-- MODULE 3: Payments & Deposit
-- ==========================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'full')),
    method VARCHAR(20) DEFAULT 'transfer' CHECK (method IN ('cash', 'transfer', 'card')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ==========================================
-- MODULE 4: Billing
-- ==========================================
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    closed_by UUID REFERENCES staff(id),
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bills_booking ON bills(booking_id);
CREATE INDEX idx_bills_closed_at ON bills(closed_at);

-- Bill Items (1 bill can have multiple services)
CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    price DECIMAL(10,2) NOT NULL, -- can override default price
    duration INTEGER NOT NULL -- in minutes
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX idx_bill_items_staff ON bill_items(staff_id);

-- ==========================================
-- MODULE 6: Commission Rule Engine
-- ==========================================
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    service_id UUID REFERENCES services(id), -- null = applies to all services
    staff_role VARCHAR(20), -- null = applies to all roles
    commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
    condition JSONB, -- for future tier/incentive rules
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE, -- null = no end date
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample commission rules
INSERT INTO commission_rules (rule_name, staff_role, commission_type, value) VALUES
    ('คอมมิชชั่นช่างผม 10%', 'hair', 'percentage', 10),
    ('คอมมิชชั่นช่างเล็บ 15%', 'nail', 'percentage', 15);

-- ==========================================
-- MODULE 7: Commission Calculation
-- ==========================================
CREATE TABLE staff_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id),
    bill_id UUID NOT NULL REFERENCES bills(id),
    bill_item_id UUID REFERENCES bill_items(id),
    rule_id UUID REFERENCES commission_rules(id),
    amount DECIMAL(10,2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_staff_commissions_staff ON staff_commissions(staff_id);
CREATE INDEX idx_staff_commissions_bill ON staff_commissions(bill_id);
CREATE INDEX idx_staff_commissions_calculated ON staff_commissions(calculated_at);

-- ==========================================
-- System Configuration
-- ==========================================
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default configurations
INSERT INTO system_config (key, value, description) VALUES
    ('max_advance_booking_days', '30', 'จำนวนวันที่จองล่วงหน้าได้สูงสุด'),
    ('min_cancel_hours', '24', 'ชั่วโมงขั้นต่ำที่ยกเลิกได้ก่อนนัด'),
    ('max_reschedule_per_booking', '1', 'จำนวนครั้งที่เลื่อนนัดได้ต่อ 1 booking'),
    ('nail_deposit_amount', '100', 'ค่ามัดจำโซนเล็บ (บาท)'),
    ('hair_deposit_required', 'false', 'โซนผมต้องมัดจำหรือไม่'),
    ('shop_open_time', '09:00', 'เวลาเปิดร้าน'),
    ('shop_close_time', '20:00', 'เวลาปิดร้าน'),
    ('time_slot_interval', '30', 'ช่วงเวลาจอง (นาที)');

-- ==========================================
-- Views for Dashboard
-- ==========================================

-- Today's bookings view
CREATE OR REPLACE VIEW today_bookings AS
SELECT 
    b.*,
    c.name as customer_name,
    c.phone as customer_phone,
    s.service_name,
    s.zone as service_zone
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN services s ON b.service_id = s.id
WHERE b.booking_date = CURRENT_DATE
ORDER BY b.start_time;

-- Revenue by zone (today)
CREATE OR REPLACE VIEW daily_revenue_by_zone AS
SELECT 
    s.zone,
    SUM(bi.price) as total_revenue,
    COUNT(DISTINCT b.id) as bill_count
FROM bills b
JOIN bill_items bi ON b.id = bi.bill_id
JOIN services s ON bi.service_id = s.id
WHERE DATE(b.closed_at) = CURRENT_DATE
GROUP BY s.zone;

-- Staff performance view
CREATE OR REPLACE VIEW staff_monthly_performance AS
SELECT 
    st.id as staff_id,
    st.name as staff_name,
    st.role,
    DATE_TRUNC('month', b.closed_at) as month,
    COUNT(DISTINCT b.id) as bills_count,
    SUM(bi.price) as total_revenue,
    COALESCE(SUM(sc.amount), 0) as total_commission
FROM staff st
LEFT JOIN bill_items bi ON st.id = bi.staff_id
LEFT JOIN bills b ON bi.bill_id = b.id
LEFT JOIN staff_commissions sc ON st.id = sc.staff_id AND sc.bill_id = b.id
WHERE st.is_active = true
GROUP BY st.id, st.name, st.role, DATE_TRUNC('month', b.closed_at);

-- ==========================================
-- Functions
-- ==========================================

-- Auto update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_services_timestamp
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_timestamp
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_timestamp
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_timestamp
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    p_bill_id UUID
) RETURNS void AS $$
DECLARE
    v_bill_item RECORD;
    v_rule RECORD;
    v_commission_amount DECIMAL(10,2);
BEGIN
    -- Loop through bill items
    FOR v_bill_item IN 
        SELECT bi.*, s.role as staff_role, sv.zone
        FROM bill_items bi
        JOIN staff s ON bi.staff_id = s.id
        JOIN services sv ON bi.service_id = sv.id
        WHERE bi.bill_id = p_bill_id
    LOOP
        -- Find applicable rule
        SELECT * INTO v_rule
        FROM commission_rules
        WHERE is_active = true
        AND (service_id IS NULL OR service_id = v_bill_item.service_id)
        AND (staff_role IS NULL OR staff_role = v_bill_item.staff_role)
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY service_id NULLS LAST, staff_role NULLS LAST
        LIMIT 1;
        
        IF v_rule IS NOT NULL THEN
            -- Calculate commission
            IF v_rule.commission_type = 'percentage' THEN
                v_commission_amount := v_bill_item.price * v_rule.value / 100;
            ELSE
                v_commission_amount := v_rule.value;
            END IF;
            
            -- Insert commission record
            INSERT INTO staff_commissions (staff_id, bill_id, bill_item_id, rule_id, amount)
            VALUES (v_bill_item.staff_id, p_bill_id, v_bill_item.id, v_rule.id, v_commission_amount);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer stats after bill closed
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET 
        total_spent = total_spent + NEW.final_amount,
        booking_count = booking_count + 1,
        updated_at = NOW()
    WHERE id = (SELECT customer_id FROM bookings WHERE id = NEW.booking_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_bill_insert
    AFTER INSERT ON bills
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users to read/write
-- In production, implement proper role-based policies

CREATE POLICY "Allow all for authenticated users" ON services
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON customers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON staff
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON bookings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON payments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON bills
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON bill_items
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON commission_rules
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON staff_commissions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON system_config
    FOR ALL USING (true) WITH CHECK (true);
