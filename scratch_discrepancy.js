const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testType() {
    const { data } = await supabase.from('pagos').select('mes, anio').limit(1);
    console.log("Sample pago:", data[0]);
    console.log("Type of mes:", typeof data[0].mes);
    console.log("Type of anio:", typeof data[0].anio);
}
testType();
