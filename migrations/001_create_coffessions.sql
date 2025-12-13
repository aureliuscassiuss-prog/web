-- Create the coffessions table
CREATE TABLE IF NOT EXISTS coffessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Storing as text to match existing auth (or UUID if users table uses UUID)
    content TEXT NOT NULL,
    theme VARCHAR(50) DEFAULT 'espresso', -- 'espresso', 'latte', 'mocha', 'cappuccino'
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional: If we want to track reports
    reports INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE
);

-- Index for efficient querying of recent posts
CREATE INDEX IF NOT EXISTS idx_coffessions_created_at ON coffessions(created_at);

-- Index for trending (sorting by likes)
CREATE INDEX IF NOT EXISTS idx_coffessions_likes ON coffessions(likes DESC);
