require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResourcesDetailed() {
    const { data, error } = await supabase
        .from('recursos')
        .select('id, taller, nombre_archivo, fecha_subida');

    if (error) {
        console.error('Error:', error);
    } else {
        data.forEach(r => {
            console.log(`[${r.id}] [${r.taller}] ${r.nombre_archivo} (${r.fecha_subida})`);
        });
    }
}

checkResourcesDetailed();
