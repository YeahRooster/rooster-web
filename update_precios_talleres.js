// Script para actualizar precios de talleres en Supabase
// Ejecutar con: node update_precios_talleres.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ptuzsntvaakqthxkwmie.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dXpzbnR2YWFrcXRoeGt3bWllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUyOTc2NywiZXhwIjoyMDg0MTA1NzY3fQ.NzyM-6p9QLxQk-xdBwhIaNCjICTDcG251PWsVmSifwU'
);

// Precios correctos por taller
// precio_base = precio normal
// precio_desc_dia10 = precio por transferencia hasta día 10
// precio_desc_efectivo = precio en efectivo hasta día 10
const precios = [
    {
        buscar: 'dibujo',
        excluir: ['doble', 'virtual', 'manga'],
        titulo_display: 'TALLER DE DIBUJO (una clase semanal)',
        precio_base: 41000,
        precio_desc_dia10: 39000,
        precio_desc_efectivo: 37000
    },
    {
        buscar: 'doble',
        titulo_display: 'TALLER DE DIBUJO (doble carga)',
        precio_base: 60000,
        precio_desc_dia10: 58000,
        precio_desc_efectivo: 55000
    },
    {
        buscar: 'virtual',
        titulo_display: 'CLASES VIRTUALES',
        precio_base: 16500,
        precio_desc_dia10: 13500,
        precio_desc_efectivo: 13500 // sin descuento adicional por efectivo
    },
    {
        buscar: 'ceramica',
        titulo_display: 'TALLER DE CERAMICA',
        precio_base: 45000,
        precio_desc_dia10: 43000,
        precio_desc_efectivo: 40000
    },
    {
        buscar: 'guion',
        titulo_display: 'TALLER DE GUION DE HISTORIETAS',
        precio_base: 30000,
        precio_desc_dia10: 28000,
        precio_desc_efectivo: 25000
    },
    {
        buscar: 'ingles',
        excluir: ['hora'],
        titulo_display: 'TALLER DE INGLES (mensual)',
        precio_base: 40000,
        precio_desc_dia10: 38000,
        precio_desc_efectivo: 35000
    },
    {
        buscar: 'hora',
        titulo_display: 'TALLER DE INGLES POR HORA',
        precio_base: 6000,
        precio_desc_dia10: 6000,
        precio_desc_efectivo: 6000
    },
    {
        buscar: 'italiano',
        titulo_display: 'TALLER INICIAL DE ITALIANO',
        precio_base: 32000,
        precio_desc_dia10: 30000,
        precio_desc_efectivo: 28000
    },
    {
        buscar: 'manga',
        titulo_display: 'TALLER DE MANGA',
        precio_base: 38000,
        precio_desc_dia10: 36000,
        precio_desc_efectivo: 34000
    }
];

async function main() {
    console.log('🔍 Leyendo talleres actuales...\n');
    const { data: talleres, error } = await supabase
        .from('talleres')
        .select('id, titulo, precio_base, precio_desc_dia10, precio_desc_efectivo')
        .order('titulo');

    if (error) {
        console.error('❌ Error leyendo talleres:', error);
        process.exit(1);
    }

    console.log('Talleres encontrados:');
    talleres.forEach(t => console.log(`  [${t.id}] ${t.titulo} | Base: ${t.precio_base} | Dia10: ${t.precio_desc_dia10} | Efectivo: ${t.precio_desc_efectivo}`));
    console.log('');

    // Actualizar cada taller según su nombre
    for (const taller of talleres) {
        const titulo = (taller.titulo || '').toLowerCase();
        
        let config = null;
        for (const p of precios) {
            const matchBuscar = titulo.includes(p.buscar);
            const matchExcluir = p.excluir ? p.excluir.some(ex => titulo.includes(ex)) : false;
            if (matchBuscar && !matchExcluir) {
                config = p;
                break;
            }
        }

        if (!config) {
            console.log(`⚠️  Sin config para: "${taller.titulo}" - omitido`);
            continue;
        }

        const { error: updErr } = await supabase
            .from('talleres')
            .update({
                precio_base: config.precio_base,
                precio_desc_dia10: config.precio_desc_dia10,
                precio_desc_efectivo: config.precio_desc_efectivo
            })
            .eq('id', taller.id);

        if (updErr) {
            console.error(`❌ Error actualizando "${taller.titulo}":`, updErr.message);
        } else {
            console.log(`✅ "${taller.titulo}" → Base: $${config.precio_base} | Transf (día10): $${config.precio_desc_dia10} | Efectivo (día10): $${config.precio_desc_efectivo}`);
        }
    }

    console.log('\n🎉 Actualización de precios completada.');
}

main().catch(console.error);
