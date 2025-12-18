-- Full Setup & Repair for Events Feature (Run this in Supabase SQL Editor)

-- 1. Create payment_configs table
CREATE TABLE IF NOT EXISTS payment_configs (
    _id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'razorpay',
    key_id TEXT NOT NULL,
    key_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_configs_user_id ON payment_configs(user_id);

-- 2. Repair/Update events table
-- This ensures existing 'events' tables get the new columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='total_slots') THEN
        ALTER TABLE events ADD COLUMN total_slots INTEGER DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='booked_slots') THEN
        ALTER TABLE events ADD COLUMN booked_slots INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='registration_deadline') THEN
        ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='accepted_payment_methods') THEN
        ALTER TABLE events ADD COLUMN accepted_payment_methods TEXT[] DEFAULT ARRAY['razorpay'];
    END IF;
END $$;

-- Ensure Foreign Key exists for join
-- We drop and recreate it to be sure it points to the right column (_id)
ALTER TABLE events DROP CONSTRAINT IF EXISTS fk_organizer;
ALTER TABLE events ADD CONSTRAINT fk_organizer FOREIGN KEY (organizer_id) REFERENCES users(_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- 3. Create/Repair tickets table
CREATE TABLE IF NOT EXISTS tickets (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed',
    payment_id TEXT,
    gateway TEXT,
    qr_code_data TEXT,
    amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
