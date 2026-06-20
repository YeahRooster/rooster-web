const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPrices() {
    const { data: talleres, error } = await supabase
        .from('talleres')
        .select('id, titulo, precio_base, precio_desc_dia10, precio_desc_efectivo, activo');

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log("\n📋 Detalle de precios de talleres:");
    talleres.forEach(t => {
        console.log(`[ID: ${t.id}] ${t.titulo} | Base: ${t.precio_base} | Dia10: ${t.precio_desc_dia10} | Efectivo: ${t.precio_desc_efectivo} | Activo: ${t.activo}`);
    });
}

checkPrices();
