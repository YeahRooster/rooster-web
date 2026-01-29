require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResources() {
    console.log('--- REVISANDO RECURSOS ---');
    const { data, error } = await supabase
        .from('recursos')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total Recursos:', data.length);
        if (data.length > 0) {
            console.log('Muestra:', data[0]);
        }
    }
}

checkResources();
