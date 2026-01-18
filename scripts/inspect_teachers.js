require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTeachers() {
    console.log("🔍 INSPECCIONANDO TABLA PROFESORES...");

    const { data: teachers, error } = await supabase
        .from('profesores')
        .select('*');

    if (error) {
        console.error("❌ Error fetching teachers:", error);
        return;
    }

    if (!teachers || teachers.length === 0) {
        console.log("⚠️ No hay profesores en la base de datos.");
        return;
    }

    console.log(`✅ ${teachers.length} profesores encontrados:`);
    teachers.forEach(t => {
        console.log("------------------------------------------------");
        console.log(`👤 Nombre: ${t.nombre}`);
        console.log(`🆔 DNI: ${t.dni}`);
        console.log(`🔑 Pass: ${t.password}`);
        console.log(`🎨 Taller Asignado: '${t.taller_asignado}'`); // Comillas para ver espacios
    });

    console.log("\n🔍 INSPECCIONANDO ALGUNAS INSCRIPCIONES (para comparar nombres de taller)...");
    const { data: insc } = await supabase.from('inscripciones').select('taller_nombre').limit(5);
    insc.forEach(i => console.log(`   📝 Inscripción en: '${i.taller_nombre}'`));
}

inspectTeachers();
