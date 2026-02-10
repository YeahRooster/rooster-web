
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSofia() {
    const dni = '33213712'; // Sofia De Bartolo
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
    const { data: pagos } = await supabase.from('pagos').select('*').eq('alumno_dni', dni);
    console.log('💰 Todos los Pagos:', JSON.stringify(pagos, null, 2));

    // 4. Notificaciones
    const { data: notifs } = await supabase.from('social_notifications').select('*').eq('destinatario_dni', dni);
    console.log('🔔 Notificaciones:', notifs);

    // 5. Simulación lógica Enriched
    const misPagosEsteMes = pagos?.filter(p => p.mes == mesActual && p.anio == anioActual) || [];
    console.log(`📅 Pagos detectados para Mes ${mesActual}/${anioActual}:`, misPagosEsteMes);

    const estaAlDiaAdmin = inscripciones?.every(ins => {
        const tallerNombre = ins.talleres?.titulo || ins.taller_nombre;
        return misPagosEsteMes.some(p => p.taller === tallerNombre && p.estado === 'pagado');
    });
    console.log('📊 ¿Está al día según ADMIN?:', estaAlDiaAdmin);
}

inspectSofia();
