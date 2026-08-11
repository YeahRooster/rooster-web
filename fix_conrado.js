import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() { 
    const { data, error } = await supabaseAdmin.from('challenge_submissions').update({ categoria: 'menores' }).eq('id', '894bc846-0f51-4191-8735-277257f6f78d').select(); 
    console.log('Updated:', data); 
    console.log('Error:', error); 
} 
check();
