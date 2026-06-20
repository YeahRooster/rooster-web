const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillPagos() {
    console.log("Iniciando backfill de pagos...");
    
    // Obtener todos los pagos migrados (metodo_pago = 'MIGRACION') que tienen estado 'pagado'
    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('id, mes, anio, fecha_pago, metodo_pago, estado')
        .eq('metodo_pago', 'MIGRACION')
        .eq('estado', 'pagado');

    if (error) {
        console.error("Error obteniendo pagos:", error);
        return;
    }

    console.log(`Se encontraron ${pagos.length} pagos para corregir.`);

    const today = new Date();
    let updatedCount = 0;

    for (const p of pagos) {
        const pMes = parseInt(p.mes);
        const pAnio = parseInt(p.anio);
        
        // Si el pago es de un mes/año anterior o es del mes actual pero fue un error de sincronización
        // Vamos a establecer la fecha de pago al día 10 del mes correspondiente
        const nuevaFechaPago = new Date(Date.UTC(pAnio, pMes - 1, 10, 12, 0, 0));
        
        // Si el pago es del mes actual, lo dejamos con su fecha (o lo seteamos al 10 si no es de hoy).
        // Si es de un mes futuro (ej pagó adelantado), le ponemos el día que se cobró? 
        // Como fue migracion, asumiremos que los adelantados se pagaron el mes en curso (mayo 2026),
        // o mejor, los retroactivos van a su mes, y los futuros se pagaron "hoy" (mayo).
        
        let fechaFinal = nuevaFechaPago;
        
        // Si el mes pagado (pMes/pAnio) es > al mes actual, significa que lo pagó adelantado hoy.
        const currentMonthIdx = today.getFullYear() * 12 + today.getMonth();
        const pagoMonthIdx = pAnio * 12 + (pMes - 1);
        
        if (pagoMonthIdx > currentMonthIdx) {
            // Pagos adelantados: Se cobraron en el mes actual (hace un ratito)
            fechaFinal = today;
        }

        const { error: updErr } = await supabase
            .from('pagos')
            .update({ fecha_pago: fechaFinal.toISOString() })
            .eq('id', p.id);
            
        if (updErr) {
            console.error(`Error actualizando pago ID ${p.id}:`, updErr);
        } else {
            updatedCount++;
        }
    }

    console.log(`✅ Se corrigieron exitosamente las fechas de ${updatedCount} pagos.`);
}

backfillPagos();
