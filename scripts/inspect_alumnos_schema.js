const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("🔍 Inspecting 'alumnos' table schema...");
    const { data, error } = await supabase.from('alumnos').select('*').limit(1);
    if (error) {
        console.error("Error fetching from 'alumnos':", error);
        return;
    }
    if (data && data.length > 0) {
        console.log("Column names in 'alumnos':", Object.keys(data[0]));
    } else {
        console.log("No data in 'alumnos' table to inspect columns.");
    }
}

inspectSchema();
