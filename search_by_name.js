const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchStudentByName(namePart) {
    console.log(`🔍 Buscando alumnos con nombre parecido a: [${namePart}]`);
    const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .ilike('nombre', `%${namePart}%`);

    if (error) console.error("Error:", error.message);
    else {
        console.log(`✅ Resultados para "${namePart}":`, data.length);
        data.forEach(a => console.log(`- DNI: [${a.dni}] | Nombre: ${a.nombre} | Activo: ${a.activo}`));
    }
}

async function run() {
    await searchStudentByName('Cristian');
    await searchStudentByName('Reartes');
    await searchStudentByName('Juan Pablo');
    await searchStudentByName('Rodriguez');
    await searchStudentByName('Eva');
    await searchStudentByName('Carlozzi');
}

run();
