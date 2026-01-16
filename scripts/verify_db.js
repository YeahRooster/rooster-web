const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("🔍 Verificación Profunda de Supabase...");

    // 1. Talleres
    const { data: talleres, error: eT } = await supabase.from('talleres').select('*');
    console.log(`📊 Talleres en DB: ${talleres?.length || 0}`);
    if (talleres) {
        talleres.forEach(t => {
            console.log(`[${t.id}] ${t.titulo} | Activo: ${t.activo} | IMG: ${t.imagen_url.substring(0, 50)}...`);
        });
    }

    // 2. Alumnos
    const { data: alumnos, error: eA } = await supabase.from('alumnos').select('*');
    console.log(`👤 Alumnos en DB: ${alumnos?.length || 0}`);
    if (alumnos) {
        alumnos.forEach(a => console.log(`- [${a.dni}] ${a.nombre}`));
    }

    // 3. Pagos (Verificar duplicados)
    const { data: pagos, error: eP } = await supabase.from('pagos').select('*').limit(20);
    console.log(`💰 Pagos en DB (Primeros 20): ${pagos?.length || 0}`);
    if (pagos) {
        pagos.forEach(p => console.log(`DNI: ${p.alumno_dni} | Taller: ${p.taller} | Mes: ${p.mes} | Año: ${p.anio}`));
    }

    // 4. Inscripciones
    const { data: ins, error: eI } = await supabase.from('inscripciones').select('*');
    console.log(`📝 Inscripciones en DB: ${ins?.length || 0}`);
}

verify();
