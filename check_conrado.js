import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() { 
    const { data: student, error: err1 } = await supabaseAdmin.from('alumnos').select('*').eq('dni', '55305197'); 
    console.log("Student:", student);
    
    const { data: submission, error: err2 } = await supabaseAdmin.from('challenge_submissions').select('*').eq('alumno_dni', '55305197');
    console.log("Submission:", submission);
} 
check();
