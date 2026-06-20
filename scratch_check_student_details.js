const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    // Mock the query in /api/v2/payments/history/route.js
    const { data: inscripciones, error: inscErr } = await supabase
        .from('inscripciones')
        .select(`
            *,
            alumnos(dni, nombre, email, pais),
            talleres(id, titulo)
        `)
        .eq('alumno_dni', '1234');
        
    if (inscErr) {
        console.error(inscErr);
        return;
    }
    
    console.log(`Inscripciones:`, inscripciones);
    
    for (const insc of inscripciones) {
        const tallerTitle = insc.talleres?.titulo || insc.taller;
        console.log(`Buscando pagos para alumno: ${insc.alumno_dni}, taller: [${tallerTitle}]`);
        const { data: pagos, error: pagosErr } = await supabase
            .from('pagos')
            .select('*')
            .eq('alumno_dni', insc.alumno_dni)
            .eq('taller', tallerTitle)
            .eq('anio', 2026)
            .order('cuota_numero');
            
        if (pagosErr) console.error(pagosErr);
        console.log(`Pagos encontrados (${pagos?.length || 0}):`, pagos);
    }
}
checkDetails();
