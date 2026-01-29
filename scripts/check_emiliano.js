require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmiliano() {
    const { data: prof, error } = await supabase
        .from('profesores')
        .select('*')
        .eq('nombre', 'Emiliano Gallo')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Datos de Emiliano:', prof);
    }
}

checkEmiliano();
