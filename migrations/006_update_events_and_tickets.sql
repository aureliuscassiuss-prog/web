-- Update events table
ALTER TABLE events 
ADD COLUMN total_slots INTEGER DEFAULT 100,
ADD COLUMN booked_slots INTEGER DEFAULT 0,
ADD COLUMN registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN accepted_payment_methods TEXT[] DEFAULT ARRAY['razorpay'];

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled
    payment_id TEXT,
    gateway TEXT,
    qr_code_data TEXT,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
