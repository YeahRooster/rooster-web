const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillPayments() {
    console.log("🚀 Iniciando backfill corrector de pagos...");

    // 1. Obtener todos los pagos
    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('id, mes, anio, cuota_numero, monto, monto_final, alumno_dni, taller');

    if (error) {
        console.error("❌ Error al obtener pagos:", error);
        return;
    }

    console.log(`Se encontraron ${pagos.length} pagos totales en la base de datos.`);

    let updatedCount = 0;

    for (const p of pagos) {
        const correctCuota = parseInt(p.mes);
        const correctMontoFinal = parseFloat(p.monto || 0);
        
        let needsUpdate = false;
        const updateData = {};

        // Validar cuota_numero
        if (p.cuota_numero !== correctCuota) {
            updateData.cuota_numero = correctCuota;
            needsUpdate = true;
        }

        // Validar monto_final (si es null o difiere del monto principal)
        if (p.monto_final !== correctMontoFinal) {
            updateData.monto_final = correctMontoFinal;
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`🛠️ Corrigiendo Pago ID ${p.id} | DNI: ${p.alumno_dni} | Taller: ${p.taller}`);
            console.log(`   - Mes: ${p.mes} | Cuota Anterior: ${p.cuota_numero} -> Nueva: ${correctCuota}`);
            console.log(`   - Monto: ${p.monto} | Monto Final Anterior: ${p.monto_final} -> Nuevo: ${correctMontoFinal}`);

            const { error: updErr } = await supabase
                .from('pagos')
                .update(updateData)
                .eq('id', p.id);

            if (updErr) {
                console.error(`❌ Error actualizando pago ID ${p.id}:`, updErr.message);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`\n✅ Backfill completado exitosamente. Se actualizaron ${updatedCount} pagos.`);
}

backfillPayments();
