require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAlumno() {
    console.log("Intentando insertar un alumno de prueba...");
    // Try to find if there are duplicate emails in the GAS sample (I can't do that easily now)
    // But let's check if the upsert error is happening
    const { error } = await supabase.from('alumnos').upsert([
        { dni: 'TEST1', email: 'test@gmail.com', nombre: 'Test 1' },
        { dni: 'TEST2', email: 'test@gmail.com', nombre: 'Test 2' }
    ]);

    if (error) {
        console.log("Error de upsert alumnos:", error);
    } else {
        console.log("Upsert de prueba exitoso.");
        await supabase.from('alumnos').delete().in('dni', ['TEST1', 'TEST2']);
    }
}

testAlumno();
