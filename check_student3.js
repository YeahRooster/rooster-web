import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() { 
    const { data, error } = await supabaseAdmin.from('alumnos').select('*').or('dni.eq.1751530161,email.eq.alexa-piba@hotmail.com'); 
    console.log(data); 
    console.log(error); 
} 
check();
