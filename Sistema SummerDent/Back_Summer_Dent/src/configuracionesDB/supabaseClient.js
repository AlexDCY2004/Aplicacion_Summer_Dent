import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DB_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
    console.warn('Warning: SUPABASE_URL or SUPABASE keys not set in environment');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
});

// Admin client using service role key when available
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
});

export default supabase;
