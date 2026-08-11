import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() { 
    // we query auth.users if we could, but we can't directly query auth.users with the standard supabase client without the admin api, let's try calling admin api:
    const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    console.log("Auth Users:", users?.users?.filter(u => u.email.includes('alexa')));
    
    // Also let's just get everything from alumnos and do manual search
    const { data, error } = await supabaseAdmin.from('alumnos').select('*'); 
    console.log("Alumnos match DNI or Email:", data?.filter(d => d.dni === '1751530161' || d.email === 'alexa-piba@hotmail.com' || d.nombre.includes('Samuel'))); 
} 
check();
