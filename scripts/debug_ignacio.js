require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIgnacio() {
    const dni = '43425198';
    console.log(`--- REVISANDO DATOS DE IGNACIO (${dni}) ---`);

    const { data: insc, error: iErr } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('alumno_dni', dni);

    console.log('Inscripciones:', insc);

    const { data: pagos, error: pErr } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_dni', dni)
        .order('mes', { ascending: true });

    console.log('Pagos:', pagos);

    // Revisar talleres
    const workshopNames = insc.map(i => i.taller_nombre);
    for (const name of workshopNames) {
        const { data: res } = await supabase.from('recursos').select('*').ilike('taller', `%${name}%`);
        console.log(`Recursos para ${name}:`, res?.length || 0);
    }
}

checkIgnacio();
