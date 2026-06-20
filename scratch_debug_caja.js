const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCaja() {
    const now = new Date();
    // Use string matching or simple month check to see all pagos
    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${pagos.length} total pagos.`);
    
    // Now filter manually to see what's wrong with fecha_pago
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    console.log("firstDay ISO:", firstDay.toISOString());
    console.log("nextMonth ISO:", nextMonth.toISOString());

    const inRange = pagos.filter(p => {
        if (!p.fecha_pago) return false;
        const d = new Date(p.fecha_pago);
        return d >= firstDay && d < nextMonth && p.estado === 'pagado';
    });

    console.log("Pagos in range (JS filter):", inRange.length);
    console.log("Sum (JS filter):", inRange.reduce((a, b) => a + parseFloat(b.monto), 0));

    // Try DB filter
    const { data: dbFiltered } = await supabase
        .from('pagos')
        .select('monto, fecha_pago')
        .gte('fecha_pago', firstDay.toISOString())
        .lt('fecha_pago', nextMonth.toISOString())
        .eq('estado', 'pagado');
        
    console.log("Pagos in range (DB filter):", dbFiltered.length);
    console.log("Sum (DB filter):", dbFiltered.reduce((a, b) => a + parseFloat(b.monto), 0));
    
    // Check old logic
    const { data: oldLogic } = await supabase
        .from('pagos')
        .select('monto, fecha_pago')
        .eq('mes', String(now.getMonth() + 1))
        .eq('anio', now.getFullYear())
        .eq('estado', 'pagado');
        
    console.log("Pagos old logic:", oldLogic.length);
    console.log("Sum old logic:", oldLogic.reduce((a, b) => a + parseFloat(b.monto), 0));
}

checkCaja();
