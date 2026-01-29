require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    // There isn't a direct "describe" in supabase-js, so we try something else
    // or just try to insert one dummy and see error
    console.log("Intentando insertar una inscripción de prueba para ver errores...");
    const { error } = await supabase.from('inscripciones').insert({
        alumno_dni: 'TEST_DNI',
        taller_nombre: 'TEST_TALLER'
    });

    if (error) {
        console.log("Error de inserción:", error);
    } else {
        console.log("Inserción de prueba exitosa.");
        // Clean up
        await supabase.from('inscripciones').delete().eq('alumno_dni', 'TEST_DNI');
    }
}

inspectSchema();
