const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminCredentials() {
    console.log("🔍 Buscando credenciales de admin...");

    // Buscar en tabla profesores
    const { data: profesores, error } = await supabase
        .from('profesores')
        .select('dni, nombre, password')
        .limit(10);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log("\n📋 Profesores registrados:");
    profesores.forEach(p => {
        console.log(`\n👤 ${p.nombre}`);
        console.log(`   Usuario (DNI): ${p.dni}`);
        console.log(`   Contraseña: ${p.password}`);
    });
}

checkAdminCredentials();
