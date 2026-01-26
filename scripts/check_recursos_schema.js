const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkResourcesSchema() {
    console.log("🔍 Verificando estructura de 'recursos'...");

    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'recursos' });

    if (error) {
        // Fallback: select * limit 0
        const { data, error: err2 } = await supabase.from('recursos').select('*').limit(1);
        if (err2) {
            console.error("❌ Error:", err2);
        } else {
            console.log("📋 Columnas (vía select):", Object.keys(data[0] || {}));
        }
    } else {
        console.log("📋 Columnas:", cols);
    }
}

checkResourcesSchema();
