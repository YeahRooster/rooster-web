const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function updateTelefonos() {
    console.log("Obteniendo dump de Google Sheets...");
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    
    if (data.status !== 'success') {
        console.error("Error obteniendo datos:", data);
        return;
    }
    
    const inscripciones = data.data.inscripciones;
    const alumnosExcel = data.data.alumnos;
    
    // 1. Mapear informacion de contacto desde inscripciones
    const contactInfoMap = new Map();
    inscripciones.forEach(i => {
        const dni = String(i[1] || "").trim();
        if (!dni) return;
        
        const email = String(i[7] || "").trim();
        const telefono = String(i[8] || "").trim();
        
        if (!contactInfoMap.has(dni)) {
            contactInfoMap.set(dni, { email: null, telefono: null });
        }
        const current = contactInfoMap.get(dni);
        if (email && email !== "") current.email = email;
        if (telefono && telefono !== "") current.telefono = telefono;
    });
    
    // 2. Mapear informacion desde alumnosExcel
    const finalUpdates = [];
    
    for (const a of alumnosExcel) {
        const col0 = String(a[0] || "").trim();
        const col3 = String(a[3] || "").trim();
        
        let dni = col3;
        if (col0.length >= 7 && col0.length <= 9) dni = col0;
        else if (col3.length >= 7 && col3.length <= 9) dni = col3;
        else dni = col3 || col0;
        
        if (!dni) continue;
        
        const contact = contactInfoMap.get(dni);
        let email = contact?.email || String(a[2] || a[7] || "").trim();
        let telefono = contact?.telefono || ((col0 !== "" && col0 !== dni) ? col0 : null);
        
        if (email === "") email = null;
        if (telefono === "") telefono = null;
        
        if (email || telefono) {
            finalUpdates.push({ dni, email, telefono, nombre: a[1] });
        }
    }
    
    console.log(`Encontrados ${finalUpdates.length} registros para actualizar.`);
    
    let successCount = 0;
    // Agrupar en batches o hacer uno por uno para asegurar que se actualicen
    for (const update of finalUpdates) {
        const { error } = await supabase
            .from('alumnos')
            .update({ telefono: update.telefono, email: update.email })
            .eq('dni', update.dni);
            
        if (!error) {
            successCount++;
        } else {
            console.error(`Error actualizando DNI ${update.dni} (${update.nombre}):`, error.message);
        }
    }
    
    console.log(`\n✅ ${successCount} de ${finalUpdates.length} alumnos actualizados con teléfono/email en Supabase.`);
}

updateTelefonos();
