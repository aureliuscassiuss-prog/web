
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
