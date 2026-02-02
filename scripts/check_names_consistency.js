require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNames() {
    console.log('--- TALLERES ---');
    const { data: tall } = await supabase.from('talleres').select('titulo');
    console.log(tall.map(t => t.titulo));

    console.log('\n--- PROFESORES ---');
    const { data: prof } = await supabase.from('profesores').select('nombre, taller_asignado');
    console.log(prof);

    console.log('\n--- RECURSOS (Nombres de talleres usados) ---');
    const { data: res } = await supabase.from('recursos').select('taller');
    const uniqueRes = [...new Set(res.map(r => r.taller))];
    console.log(uniqueRes);
}

checkNames();
