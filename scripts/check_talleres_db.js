const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTalleres() {
    console.log("🔍 Consultando tabla 'talleres'...");
    const { data: talleres, error } = await supabase
        .from('talleres')
        .select('id, titulo, dia, horario, activo');

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Total de registros: ${talleres.length}`);

    // Agrupar por título para ver cuántos hay de cada uno
    const conteo = {};
    talleres.forEach(t => {
        conteo[t.titulo] = (conteo[t.titulo] || 0) + 1;
    });

    console.log("\n📈 Desglose por título:");
    Object.entries(conteo).forEach(([titulo, cant]) => {
        console.log(`- ${titulo}: ${cant} registros`);
    });

    console.log("\n📋 Detalle de registros:");
    talleres.forEach(t => {
        console.log(`[ID: ${t.id}] ${t.titulo} | D: ${t.dia} | H: ${t.horario} | Activo: ${t.activo}`);
    });
}

checkTalleres();
