require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addIndexes() {
    console.log('Intentando optimizar base de datos con índices...');

    const start = Date.now();
    await supabase.from('pagos').select('id').eq('alumno_dni', '1234').limit(1);
    const end = Date.now();
    console.log(`Consulta simple a 'pagos' demoró: ${end - start}ms`);

    const start2 = Date.now();
    await supabase.from('inscripciones').select('*, talleres(*)').eq('alumno_dni', '1234');
    const end2 = Date.now();
    console.log(`Consulta con JOIN a 'talleres' demoró: ${end2 - start2}ms`);
}

addIndexes();
