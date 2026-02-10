
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupSofia() {
    const dni = '33213712'; // Sofia De Bartolo

    console.log(`🧹 Iniciando limpieza para Sofia (DNI: ${dni})...`);

    // 1. Eliminar el registro de Enero (Mes 1)
    const { error: delErr } = await supabase
        .from('pagos')
        .delete()
        .eq('alumno_dni', dni)
        .eq('mes', 1)
        .eq('anio', 2026);

    if (delErr) console.error('❌ Error eliminando registro de Enero:', delErr);
    else console.log('✅ Registro de Enero eliminado (si existía).');

    // 2. Renumerar Febrero (Mes 2) como Cuota 1
    const { error: updErr } = await supabase
        .from('pagos')
        .update({ cuota_numero: 1 })
        .eq('alumno_dni', dni)
        .eq('mes', 2)
        .eq('anio', 2026);

    if (updErr) console.error('❌ Error actualizando número de cuota de Febrero:', updErr);
    else console.log('✅ Registro de Febrero actualizado a Cuota 1.');

    console.log('✨ Limpieza individual finalizada.');
}

cleanupSofia();
