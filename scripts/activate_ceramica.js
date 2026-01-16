const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function activateCeramica() {
    console.log("🏺 Activando Taller de Cerámica...");
    const { data, error } = await supabase
        .from('talleres')
        .update({ activo: true })
        .ilike('titulo', '%ceramica%');

    if (error) {
        console.error("Error activando cerámica:", error);
    } else {
        console.log("✅ Taller de Cerámica activado con éxito.");
    }
}

activateCeramica();
