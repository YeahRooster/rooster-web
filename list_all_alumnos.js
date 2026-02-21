const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllAlumnos() {
    console.log(`🔍 Listando todos los alumnos de la DB...`);
    const { data, error } = await supabase
        .from('alumnos')
        .select('*');

    if (error) console.error("Error:", error.message);
    else {
        console.log(`✅ Total alumnos:`, data.length);
        data.forEach(a => console.log(`DNI: [${a.dni}] | Nombre: [${a.nombre}]`));
    }
}

listAllAlumnos();
