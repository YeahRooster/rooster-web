import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() { 
    const final_dni_string = "55531043"; // Ignacio
    const final_dni_number = 55531043;
    
    // Testing how .eq behaves with string vs number
    const { data: res1, error: err1 } = await supabaseAdmin.from('alumnos').select('acceso_restringido, es_menor').eq('dni', final_dni_string).single();
    console.log("With String:", res1, err1);
    
    const { data: res2, error: err2 } = await supabaseAdmin.from('alumnos').select('acceso_restringido, es_menor').eq('dni', final_dni_number).single();
    console.log("With Number:", res2, err2);
    
    // Also check what is currently in challenge_submissions
    const { data: submissions } = await supabaseAdmin.from('challenge_submissions').select('id, alumno_dni, alumno_nombre, categoria').in('alumno_dni', ['55531043', '55535358', '55535380', '53804618', '49271493']);
    console.log("Submissions:", submissions);
} 
check();
