
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectBautista() {
    const dni = '48810833'; // Bautista Herrera
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    console.log(`🔍 Inspeccionando datos para DNI: ${dni}...`);

    // 1. Alumno
    const { data: student } = await supabase.from('alumnos').select('*').eq('dni', dni).single();
    console.log('👤 Alumno:', student);

    // 2. Inscripciones
    const { data: inscripciones } = await supabase.from('inscripciones').select('*, talleres(*)').eq('alumno_dni', dni);
    console.log('📝 Inscripciones:', JSON.stringify(inscripciones, null, 2));

    // 3. Pagos
    const { data: pagos } = await supabase.from('pagos').select('*').eq('alumno_dni', dni).order('anio').order('mes');
    console.log('💰 Todos los Pagos:', JSON.stringify(pagos, null, 2));

}

inspectBautista();
