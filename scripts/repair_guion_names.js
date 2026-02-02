require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function repairGuion() {
    const OLD_NAME = 'TALLER DE GUION';
    const NEW_NAME = 'TALLER DE GUION DE HISTORIETAS';

    console.log(`Reparando inconsistencia: "${OLD_NAME}" -> "${NEW_NAME}"`);

    // 1. Actualizar Profesores
    const { error: pErr } = await supabase
        .from('profesores')
        .update({ taller_asignado: NEW_NAME })
        .eq('taller_asignado', OLD_NAME);

    if (pErr) console.error('Error actualizando profesores:', pErr);
    else console.log('Profesores actualizados correctamente.');

    // 2. Actualizar Recursos
    const { error: rErr } = await supabase
        .from('recursos')
        .update({ taller: NEW_NAME })
        .eq('taller', OLD_NAME);

    if (rErr) console.error('Error actualizando recursos:', rErr);
    else console.log('Recursos actualizados correctamente.');
}

repairGuion();
