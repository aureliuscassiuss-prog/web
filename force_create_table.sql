-- 1. Create the shared_lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS shared_lists (
    slug text PRIMARY KEY,
    "ownerId" text NOT NULL, -- Stored as text to match your auth system
    resources text[],        -- Array of resource IDs (text)
    note text,
    "createdAt" timestamptz DEFAULT timezone('utc'::text, now())
);

-- 2. Add shareSlug to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS "shareSlug" text;

-- 3. Verify it exists (This will just return the definition)
SELECT * FROM information_schema.tables WHERE table_name = 'shared_lists';
