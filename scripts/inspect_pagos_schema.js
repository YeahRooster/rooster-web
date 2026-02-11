const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
    console.log("🔍 Inspeccionando esquema de 'pagos'...");

    // Intentar obtener un registro para ver las columnas
    const { data, error } = await supabase.from('pagos').select('*').limit(1);

    if (error) {
        console.error("❌ Error al leer tabla:", error.message);
        return;
    }

    console.log("✅ Conexión exitosa.");
    if (data && data.length > 0) {
        console.log("Columnas detectadas:", Object.keys(data[0]));
    } else {
        console.log("La tabla está vacía, no se pueden detectar columnas mediante SELECT *.");

        // Intentar inserción de prueba (rollback manual o borrado) para ver si falla por esquema
        console.log("Intentando inserción de prueba...");
        const { error: insError } = await supabase.from('pagos').insert({
            alumno_dni: 'TEST',
            taller: 'TEST',
            mes: 1,
            anio: 2026,
            estado: 'test'
        });

        if (insError) {
            console.log("❌ Error en inserción de prueba (posiblemente por esquema):", insError.message);
        } else {
            console.log("✅ Inserción de prueba exitosa. Limpiando...");
            await supabase.from('pagos').delete().eq('alumno_dni', 'TEST');
        }
    }
}

inspectSchema();
