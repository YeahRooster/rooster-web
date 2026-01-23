const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupDoubleWorkshop() {
    console.log("🚀 Creando Taller de Doble Carga...");

    const doubleWorkshop = {
        titulo: 'TALLER DE DIBUJO (DOBLE CARGA)',
        dia: 'MULTIPLE',
        horario: 'A COORDINAR',
        descripcion_corta: 'Modalidad intensiva de 2 clases por semana.',
        descripcion_larga: 'Acceso a dos turnos semanales de dibujo con tarifa bonificada.',
        imagen_url: '',
        cupos_totales: 50,
        cupos_ocupados: 0,
        activo: false, // Invisible en listado general
        precio_base: 43000,
        precio_desc_dia10: 41000,
        precio_desc_efectivo: 38000,
        tipo_cobro: 'MENSUAL'
    };

    // Upsert por título
    const { data: existing } = await supabase.from('talleres').select('id').eq('titulo', doubleWorkshop.titulo).maybeSingle();

    if (existing) {
        console.log("♻️ Actualizando taller existente...");
        const { error } = await supabase.from('talleres').update(doubleWorkshop).eq('id', existing.id);
        if (error) console.error("❌ Error de update:", error);
        else console.log("✅ Taller actualizado.");
    } else {
        console.log("🆕 Insertando nuevo taller...");
        const { error } = await supabase.from('talleres').insert(doubleWorkshop);
        if (error) console.error("❌ Error de insert:", error);
        else console.log("✅ Taller creado.");
    }
}

setupDoubleWorkshop();
