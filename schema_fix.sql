
-- Run this in your Supabase SQL Editor to fix the missing columns

-- Add 'resourceType' column if it doesn't exist
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS "resourceType" text DEFAULT 'notes';

-- Add 'examYear' column if it doesn't exist (fixing the original error)
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS "examYear" text;

-- Add 'type' column as alias just in case (optional, but good for safety if we revert)
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS type text;

-- Ensure other columns exist
ALTER TABLE resources ADD COLUMN IF NOT EXISTS year text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS unit text;

-- Add 'shareSlug' to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "shareSlug" text;

-- Create 'shared_lists' table for snapshot sharing
CREATE TABLE IF NOT EXISTS shared_lists (
    slug text PRIMARY KEY,
    "ownerId" text NOT NULL, -- references users._id (text)
    resources text[], -- Array of resource IDs
    note text,
    "createdAt" timestamptz DEFAULT timezone('utc'::text, now())
);
