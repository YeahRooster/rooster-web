const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCuotaNumero() {
    console.log("Iniciando corrección de cuota_numero...");
    
    // Obtener todos los pagos que tienen cuota_numero null
    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('id, mes')
        .is('cuota_numero', null);

    if (error) {
        console.error("Error obteniendo pagos:", error);
        return;
    }

    console.log(`Se encontraron ${pagos.length} pagos para corregir.`);

    let updatedCount = 0;

    for (const p of pagos) {
        const cuota = parseInt(p.mes);
        if (isNaN(cuota)) {
            console.log(`Pago ID ${p.id} tiene mes inválido: ${p.mes}`);
            continue;
        }

        const { error: updErr } = await supabase
            .from('pagos')
            .update({ cuota_numero: cuota })
            .eq('id', p.id);
            
        if (updErr) {
            console.error(`Error actualizando pago ID ${p.id}:`, updErr);
        } else {
            updatedCount++;
        }
    }

    console.log(`✅ Se corrigieron exitosamente cuota_numero de ${updatedCount} pagos.`);
}

fixCuotaNumero();
