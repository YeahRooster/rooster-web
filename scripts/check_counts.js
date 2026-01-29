require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
    const { count: countAlumnos, error: errA } = await supabase.from('alumnos').select('*', { count: 'exact', head: true });
    const { count: countInsc, error: errI } = await supabase.from('inscripciones').select('*', { count: 'exact', head: true });

    console.log('--- ESTADO DE LA BASE DE DATOS ---');
    console.log('Total Alumnos:', countAlumnos);
    console.log('Total Inscripciones:', countInsc);

    if (countInsc > 0) {
        const { data: samples } = await supabase.from('inscripciones').select('alumno_dni, taller_nombre').limit(5);
        console.log('Muestra de Inscripciones:', samples);
    }
}

checkData();
