require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabase() {
    const dni = '43425198';
    const { data, error } = await supabase.from('inscripciones').select('*').eq('alumno_dni', dni);
    console.log('Inscripciones en Supabase:', data);
}

checkSupabase();
