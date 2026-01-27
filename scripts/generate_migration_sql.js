const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTable() {
    console.log("🚀 Updating 'alumnos' table with missing columns...");

    const columns = [
        { name: 'direccion', type: 'text' },
        { name: 'telefono', type: 'text' },
        { name: 'ciudad', type: 'text' },
        { name: 'localidad', type: 'text' },
        { name: 'tutor_nombre', type: 'text' },
        { name: 'tutor_telefono', type: 'text' },
        { name: 'es_menor', type: 'boolean', default: 'false' },
        { name: 'activo', type: 'boolean', default: 'false' }
    ];

    for (const col of columns) {
        console.log(`Adding column ${col.name}...`);
        // Note: Supabase doesn't have a direct "table.addColumn" in the JS client for schema changes.
        // We usually use the SQL Editor. But we can try to use RPC if they have a custom function,
        // or just rely on the fact that if we insert/upsert, it might fail if columns don't exist.
        // Since I can't run RAW SQL through the client without a specialized function (like exec_sql),
        // I will assume the user will run the SQL I provide or I will try to use a script that uses Postgres directly if possible.
        // Wait, I can use the 'supabaseAdmin' if it's set up to allow schema changes, but normally it's not.
    }

    console.log("\n⚠️ IMPORTANT: Please run the following SQL in your Supabase SQL Editor:");
    console.log(`
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS localidad TEXT,
ADD COLUMN IF NOT EXISTS tutor_nombre TEXT,
ADD COLUMN IF NOT EXISTS tutor_telefono TEXT,
ADD COLUMN IF NOT EXISTS es_menor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT false;
    `);
}

updateTable();
