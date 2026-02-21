const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan variables de entorno");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentPayments(dni) {
    console.log(`🔍 Buscando datos para DNI: ${dni}`);

    // 0. Ver algunos alumnos para ver formato
    const { data: allAlumnos, error: allErr } = await supabase
        .from('alumnos')
        .select('*')
        .limit(5);

    if (allErr) console.error("Error listando alumnos:", allErr.message);
    else {
        console.log("📌 Muestra de alumnos en DB:");
        allAlumnos.forEach(a => console.log(`- DNI: [${a.dni}] | Tipo: ${typeof a.dni} | Nombre: ${a.nombre}`));
    }

    // 1. Ver alumno
    const { data: alumnos, error: aErr } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', dni);

    if (aErr) {
        console.error("Error alumno:", aErr.message);
    } else {
        console.log("✅ Alumnos encontrados:", alumnos.length);
        alumnos.forEach(a => {
            console.log(`DNI: ${a.dni} | Nombre: ${a.nombre} | Ingreso: ${a.fecha_ingreso} | Activo: ${a.activo}`);
        });
    }

    // 2. Ver inscripciones
    const { data: insc, error: iErr } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('alumno_dni', dni);

    if (iErr) console.error("Error inscripciones:", iErr.message);
    else {
        console.log("✅ Inscripciones encontradas:", insc.length);
        insc.forEach(i => {
            console.log(`- Taller: ${i.taller_nombre} | Inicio Ciclo: ${i.fecha_inicio_ciclo}`);
        });
    }

    // 3. Ver pagos
    const { data: pagos, error: pErr } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_dni', dni);

    if (pErr) console.error("Error pagos:", pErr.message);
    else {
        console.log("✅ Pagos encontrados:", pagos.length);
        pagos.forEach((p, idx) => {
            console.log(`[${idx + 1}] Taller: ${p.taller} | Mes: ${p.mes}/${p.anio} | Cuota: ${p.cuota_numero} | Estado: ${p.estado} | Monto: ${p.monto}`);
        });
    }
}

// Probar con Eva Carlozzi Miertti (REAL DNI)
checkStudentPayments('54989452');
// Probar con Cristian Abel Reartes (REAL DNI)
checkStudentPayments('21655057');
