const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function restoreAdminAccess() {
    console.log("🔍 Buscando usuario 'admin'...\n");

    // Buscar si existe usuario admin
    const { data: adminProf, error } = await supabase
        .from('profesores')
        .select('*')
        .eq('dni', 'admin')
        .maybeSingle();

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (adminProf) {
        console.log("✅ Usuario admin EXISTE:");
        console.log(`   Usuario: admin`);
        console.log(`   Contraseña: ${adminProf.password}`);
        console.log(`   Nombre: ${adminProf.nombre}`);
    } else {
        console.log("⚠️ Usuario admin NO EXISTE. Creándolo...");

        const { data: newAdmin, error: createError } = await supabase
            .from('profesores')
            .insert({
                dni: 'admin',
                nombre: 'Administrador',
                password: 'adminRooster',
                taller_asignado: 'ADMIN'
            })
            .select()
            .single();

        if (createError) {
            console.error("❌ Error creando admin:", createError);
        } else {
            console.log("✅ Usuario admin CREADO exitosamente:");
            console.log(`   Usuario: admin`);
            console.log(`   Contraseña: adminRooster`);
        }
    }
}

restoreAdminAccess();
