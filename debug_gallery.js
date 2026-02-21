const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE GALERÍA DE ROOSTER ---');

    // 1. Contar total de posts
    const { count: total, error: countErr } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true });

    if (countErr) {
        console.error('Error contando posts:', countErr.message);
        return;
    }
    console.log(`Total de Obras en Base de Datos: ${total}`);

    // 2. Ver distribución de estados
    const { data: posts, error: fetchErr } = await supabase
        .from('social_posts')
        .select('id, titulo, status, featured');

    if (fetchErr) {
        console.error('Error obteniendo posts:', fetchErr.message);
        return;
    }

    const statusCounts = {};
    let nullStatus = 0;

    posts.forEach(p => {
        const s = p.status;
        if (s === null || s === undefined) {
            nullStatus++;
        } else {
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
    });

    console.log('\n--- Estado de los Posts ---');
    console.log(`NULL / Sin estado: ${nullStatus}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`'${status}': ${count}`);
    });

    // 3. Ver primeros 5 posts problemáticos (si hay)
    if (nullStatus > 0) {
        console.log('\n--- Ejemplo de Obras "Invisibles" ---');
        console.log(posts.filter(p => !p.status).slice(0, 3));
    }

    console.log('\n--- Fin del Diagnóstico ---');
}

diagnose();
