require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugJuanPayment() {
    const dni = '1234';
    const { data: insc } = await supabase.from('inscripciones').select('*, talleres(*)').eq('alumno_dni', dni).single();
    const { data: pagos } = await supabase.from('pagos').select('*').eq('alumno_dni', dni).neq('estado', 'pendiente');

    const ultimaCuota = pagos.length > 0 ? Math.max(...pagos.map(p => parseInt(p.cuota_numero) || 0)) : 0;
    const nextCuota = ultimaCuota + 1;

    let inicioCiclo = new Date(insc.fecha_inicio_ciclo);
    if (isNaN(inicioCiclo.getTime())) {
        inicioCiclo = new Date(new Date().getFullYear(), 0, 1);
    }

    const baseDate = new Date(inicioCiclo.getFullYear(), inicioCiclo.getMonth(), 1);
    const fechaCuotaObjetivo = new Date(baseDate);
    fechaCuotaObjetivo.setMonth(baseDate.getMonth() + (nextCuota - 1));

    console.log('--- DEBUG JUAN ---');
    console.log('DNI:', dni);
    console.log('Inicio Ciclo DB:', insc.fecha_inicio_ciclo);
    console.log('Inicio Ciclo Date:', inicioCiclo.toISOString());
    console.log('Base Date:', baseDate.toISOString());
    console.log('Next Cuota:', nextCuota);
    console.log('Cuota Objetivo:', fechaCuotaObjetivo.toISOString());
    console.log('Month Index:', fechaCuotaObjetivo.getMonth());
}

debugJuanPayment();
