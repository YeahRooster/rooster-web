const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFeaturedColumn() {
    console.log('--- DIAGNÓSTICO: Columna FEATURED ---\n');

    // 1. Verificar si la columna existe intentando leerla
    const { data, error } = await supabase
        .from('social_posts')
        .select('id, titulo, featured')
        .limit(5);

    if (error) {
        console.log('❌ ERROR al leer columna featured:');
        console.log(error.message);
        console.log('\n⚠️ LA COLUMNA "featured" NO EXISTE\n');
        return false;
    }

    console.log('✅ La columna "featured" existe!');
    console.log('\nPrimeros 5 registros:');
    data.forEach(p => {
        console.log(`  ID ${p.id}: ${p.titulo} - Featured: ${p.featured}`);
    });

    // 2. Contar cuántos posts están destacados
    const { count } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true);

    console.log(`\n🌟 Total de obras destacadas: ${count || 0}`);

    return true;
}

checkFeaturedColumn();
