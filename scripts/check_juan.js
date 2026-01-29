require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJuan() {
    const dni = '1234';
    console.log(`--- REVISANDO ALUMNO ${dni} ---`);

    const { data: insc, error: errI } = await supabase
        .from('inscripciones')
        .select('*, talleres(*)')
        .eq('alumno_dni', dni)
        .single();

    console.log('Inscripción:', insc);

    const { data: pagos, error: errP } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_dni', dni)
        .order('cuota_numero', { ascending: true });

    console.log('Pagos:', pagos);
}

checkJuan();
