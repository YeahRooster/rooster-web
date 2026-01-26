const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPagosData() {
    console.log("🔍 Verificando datos de tabla 'pagos'...\n");

    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('*')
        .limit(20);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Total de pagos en DB: ${pagos.length}`);
    console.log("\n📋 Primeros 10 registros:");
    pagos.slice(0, 10).forEach(p => {
        console.log(`\n  Alumno DNI: ${p.alumno_dni}`);
        console.log(`  Mes/Año: ${p.mes}/${p.anio}`);
        console.log(`  Cuota: ${p.cuota_numero}`);
        console.log(`  Estado: ${p.estado}`);
        console.log(`  Monto: $${p.monto_final || p.monto_base}`);
    });
}

checkPagosData();
