import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is missing in environment variables');
}

// Cliente con privilegios administrativos para bypass de RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
