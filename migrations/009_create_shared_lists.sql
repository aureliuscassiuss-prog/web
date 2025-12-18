-- Create shared_lists table for snapshot sharing mechanism
CREATE TABLE IF NOT EXISTS shared_lists (
    slug text PRIMARY KEY,
    "ownerId" text NOT NULL, -- references users._id (text)
    resources text[], -- Array of resource IDs
    note text,
    "createdAt" timestamptz DEFAULT timezone('utc'::text, now())
);

-- Add shareSlug to users table for legacy sharing
ALTER TABLE users ADD COLUMN IF NOT EXISTS "shareSlug" text;
