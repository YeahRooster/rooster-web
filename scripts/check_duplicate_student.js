
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStudent() {
    const email = 'galloemiliano78@gmail.com';
    const dni = '32582414';

    console.log(`🔍 Buscando estudiante con email: ${email}...`);
    const { data: byEmail, error: errEmail } = await supabase
        .from('alumnos')
        .select('*')
        .eq('email', email);

    if (errEmail) console.error('Error buscando por email:', errEmail);
    else console.log('Coincidencias por EMAIL:', byEmail);

    console.log(`🔍 Buscando estudiante con DNI: ${dni}...`);
    const { data: byDni, error: errDni } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', dni);

    if (errDni) console.error('Error buscando por DNI:', errDni);
    else console.log('Coincidencias por DNI:', byDni);
}

checkStudent();
