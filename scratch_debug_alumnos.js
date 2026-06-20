const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAlumnos() {
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('dni, nombre, telefono, email')
        .limit(5);

    console.log("Muestra de alumnos:", alumnos);
}
debugAlumnos();
