require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixInscripciones() {
    const { data: inscripciones, error: fetchErr } = await supabase
        .from('inscripciones')
        .select('id, taller_id, taller_nombre')
        .is('taller_nombre', null);

    if (fetchErr) {
        console.error("Error fetching", fetchErr);
        return;
    }

    if (!inscripciones || inscripciones.length === 0) {
        console.log("No null taller_nombre found.");
        return;
    }

    console.log(`Found ${inscripciones.length} inscripciones with null taller_nombre`);

    const { data: talleres, error: talleresErr } = await supabase
        .from('talleres')
        .select('id, titulo');

    if (talleresErr) {
        console.error("Error fetching talleres", talleresErr);
        return;
    }

    const talleresMap = {};
    for (const t of talleres) {
        talleresMap[t.id] = t.titulo;
    }

    for (const insc of inscripciones) {
        const titulo = talleresMap[insc.taller_id];
        if (titulo) {
            await supabase
                .from('inscripciones')
                .update({ taller_nombre: titulo })
                .eq('id', insc.id);
            console.log(`Updated inscripcion ${insc.id} with ${titulo}`);
        } else {
            console.log(`Taller ID ${insc.taller_id} not found for inscripcion ${insc.id}`);
        }
    }
    console.log("Done.");
}

fixInscripciones();
