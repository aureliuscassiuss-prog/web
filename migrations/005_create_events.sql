-- Create payment_configs table to store gateway keys
CREATE TABLE IF NOT EXISTS payment_configs (
    _id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- The Event Manager's ID
    provider VARCHAR(50) DEFAULT 'razorpay', -- 'razorpay', 'cashfree', 'phonepe'
    key_id TEXT NOT NULL,
    key_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup of user's payment config
CREATE INDEX IF NOT EXISTS idx_payment_configs_user_id ON payment_configs(user_id);


-- Create events table
CREATE TABLE IF NOT EXISTS events (
    _id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT, -- URL to event banner
    date TIMESTAMPTZ, -- When the event happens
    location TEXT, -- Physical location or URL
    price NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    organizer_id UUID NOT NULL, -- Link to user who created it
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    payment_config_id UUID, -- Specific payment gateway to use
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
