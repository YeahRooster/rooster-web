require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usamos SERVICE_ROLE_KEY para poder limpiar y cargar datos aunque el RLS esté activo
// Cae de vuelta a ANON_KEY por compatibilidad si no existe la otra
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URL del Script de Google (v20.1 con dumpAll y file IDs)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIygSzWDhILfypJMRnHTkThFzHEx1Ex0ZjJKJq9PvnCXfmg9N40LbDKhCd1v3BzDc6/exec';

async function migrate() {
    console.log("🚀 Iniciando migración de datos (MODO LIMPIEZA TOTAL)...");

    try {
        // 1. Obtener todos los datos de Google Sheets
        console.log("📥 Extrayendo datos de Google Sheets...");
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const data = await response.json();
        console.log(`✅ Datos recibidos de Sheets: ${Object.keys(data.data).join(', ')}`);

        if (data.status !== 'success') {
            throw new Error("Error obteniendo datos: " + data.message);
        }

        const { talleres, alumnos, profesores, inscripciones, pagos, recursos } = data.data;

        // --- LIMPIEZA INICIAL ---
        console.log("🧹 Limpiando tablas para carga limpia...");
        // Usamos .neq('id', -1) o similar para asegurar que borre todo con RLS desbloqueado
        await supabase.from('pagos').delete().filter('id', 'gt', 0);
        await supabase.from('inscripciones').delete().filter('id', 'gt', 0);
        await supabase.from('talleres').delete().filter('id', 'gt', 0);
        await supabase.from('alumnos').delete().neq('dni', '___NOT_EXIST___');
        await supabase.from('profesores').delete().neq('dni', '___NOT_EXIST___');

        // 2. Insertar Talleres (TODOS los turnos)
        console.log(`📊 Migrando ${talleres.length} turnos de talleres...`);
        talleres.forEach(t => console.log(`   - Taller: ${t[1]} | Día: ${t[2]} | Horario: ${t[3]}`));

        const { data: insertedTalleres, error: errT } = await supabase.from('talleres').insert(talleres.map(t => ({
            titulo: t[1],
            dia: t[2],
            horario: t[3],
            descripcion_corta: t[4],
            descripcion_larga: t[5],
            imagen_url: String(t[6]).trim(),
            cupos_totales: parseInt(t[7]) || 15,
            cupos_ocupados: parseInt(t[8]) || 0,
            activo: String(t[9]).toLowerCase() === 'si'
        }))).select();
        if (errT) throw errT;

        // Mapa para vincular inscripciones (vínculo al primer turno que coincida por nombre)
        const tallerMap = {};
        insertedTalleres.forEach(t => {
            const key = t.titulo.toLowerCase().trim();
            if (!tallerMap[key]) tallerMap[key] = t.id;
        });

        // 3. Insertar Alumnos
        console.log(`👤 Migrando ${alumnos.length} alumnos...`);
        const { error: errA } = await supabase.from('alumnos').insert(alumnos.map(a => ({
            dni: String(a[0]).trim(),
            nombre: a[1],
            email: a[2],
            password: String(a[3]),
            fecha_ingreso: a[4] ? new Date(a[4]) : new Date(),
            activo: String(a[5]).toUpperCase() === 'ACTIVO' // Lee de la columna WEB_STATUS
        })));
        if (errA) console.error("Error en alumnos:", errA);

        // 4. Insertar Profesores
        const profesoresList = profesores || [];
        console.log(`👨‍🏫 Migrando ${profesoresList.length} profesores...`);
        const { error: errP } = await supabase.from('profesores').insert(profesoresList.map(p => ({
            dni: String(p[0]).trim(),
            nombre: p[1],
            password: String(p[3]),
            taller_asignado: p[4]
        })));
        if (errP) console.error("Error en profesores:", errP);

        // 5. Insertar Inscripciones (SIN DUPLICADOS)
        console.log(`📝 Migrando ${inscripciones.length} inscripciones...`);
        const processedInscriptions = new Set();
        const uniqueInscriptions = inscripciones.filter(i => {
            const key = `${i[1]}-${i[10]}`.toLowerCase(); // dni-taller
            if (processedInscriptions.has(key)) return false;
            processedInscriptions.add(key);
            return true;
        });

        const { error: errI } = await supabase.from('inscripciones').insert(uniqueInscriptions.map(i => ({
            alumno_dni: String(i[1]).trim(),
            taller_nombre: i[10],
            taller_id: tallerMap[String(i[10]).toLowerCase().trim()] || null,
            fecha_inscripcion: i[12] ? new Date(i[12]) : new Date()
        })));
        if (errI) console.error("Error en inscripciones:", errI);

        // 6. Insertar Pagos (SIN DUPLICADOS)
        console.log(`💰 Migrando ${pagos.length} pagos...`);
        const processedPagos = new Set();
        const uniquePagos = pagos.filter(p => {
            const key = `${p[0]}-${p[2]}-${p[3]}-${p[4]}`.toLowerCase(); // dni-taller-mes-anio
            if (processedPagos.has(key)) return false;
            processedPagos.add(key);
            return true;
        });

        const { error: errPag } = await supabase.from('pagos').insert(uniquePagos.map(p => ({
            alumno_dni: String(p[0]).trim(),
            taller: p[2],
            mes: String(p[3]),
            anio: parseInt(p[4]),
            estado: String(p[5]).toLowerCase(),
            monto: parseFloat(p[6]) || 0,
            fecha_pago: p[7] ? new Date(p[7]) : null
        })));
        if (errPag) console.error("Error en pagos:", errPag);

        console.log("✅ Migración completada con éxito y sin duplicados!");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO durante la migración:", error);
    }
}

migrate();
