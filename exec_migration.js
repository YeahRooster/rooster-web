const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    try {
        const sql = fs.readFileSync('./add_avatar_columns.sql', 'utf8');
        console.log('Ejecutando SQL...');
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Error RPC:', error);
            // Fallback: Try split by ; and loop? No, exec_sql usually handles blocks.
            // If exec_sql doesn't exist, this will fail.
        } else {
            console.log('Migration completed successfully.');
        }

        // Verification
        const { data, error: errSel } = await supabase.from('alumnos').select('avatar_id').limit(1);
        if (errSel) {
            console.log('Error verifying column:', errSel.message);
        } else {
            console.log('Verification: Column avatar_id exists.');
        }

    } catch (e) {
        console.error('Script error:', e);
    }
}

run();
