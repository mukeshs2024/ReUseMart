import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const getSupabaseClient = (): SupabaseClient => {
    if (!supabase) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
    }

    return supabase;
};
