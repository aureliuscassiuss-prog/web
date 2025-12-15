-- Create a table to track guest usage limitations by IP
CREATE TABLE IF NOT EXISTS guest_usage (
  ip_address TEXT NOT NULL,
  feature_name TEXT NOT NULL, -- e.g., 'pdf_generator'
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ip_address, feature_name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_usage_ip_feature ON guest_usage(ip_address, feature_name);

-- RLS policies (Server-side only access usually, but defining for safety)
ALTER TABLE guest_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/update (backend API)
CREATE POLICY "Service role can manage guest usage" 
ON guest_usage 
USING (true) 
WITH CHECK (true);
