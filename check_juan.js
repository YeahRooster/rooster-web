const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJuan() {
    console.log("🔍 Buscando a Juan Perez...");
    
    // 1. Alumnos que contengan 'Juan'
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('*')
        .ilike('nombre', '%juan%');

    if (error) {
        console.error("Error buscando alumnos:", error);
        return;
    }

    console.log(`Se encontraron ${alumnos.length} alumnos con 'Juan':`);
    for (const a of alumnos) {
        console.log(`DNI: [${a.dni}] | Nombre: ${a.nombre} | Activo: ${a.activo}`);
        
        // Pagos de este alumno
        const { data: pagos } = await supabase
            .from('pagos')
            .select('*')
            .eq('alumno_dni', a.dni);
            
        console.log(`  -> Pagos registrados: ${pagos?.length || 0}`);
        pagos?.forEach(p => {
            console.log(`     - ID: ${p.id} | Taller: ${p.taller} | Mes: ${p.mes}/${p.anio} | Cuota No: ${p.cuota_numero} | Estado: ${p.estado} | Monto: ${p.monto}`);
        });
    }
}

checkJuan();
