
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing! Check your .env file.');
}

// Prevent crash if vars are missing by using dummy values, 
// causing operations to fail at runtime rather than startup
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);

// Deprecated helper to ease migration logic if needed, 
// though we will be replacing getDb() calls directly.
export const getSupabase = () => supabase;
