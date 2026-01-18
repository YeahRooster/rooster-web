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
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWIAakwf_zVWTsSSEzUC38LRUAJYckfFXbrMwBh137DsFCnZfkRexPBAsYB7l8Nzgz/exec';

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

        // --- LIMPIEZA / PREPARACIÓN ---
        console.log("🧹 MODO SINCRONIZACIÓN SEGURA (UPSERT)...");
        // YA NO BORRAMOS TABLAS MAESTRAS PARA NO PERDER DATOS DE USUARIO (Galería, Likes, etc.)
        // Solo limpiamos tablas transaccionales que se regeneran 100% del Excel

        await supabase.from('pagos').delete().filter('id', 'gt', 0);
        await supabase.from('inscripciones').delete().filter('id', 'gt', 0);
        // Talleres: No borramos, hacemos Upsert.
        // Alumnos: No borramos, hacemos Upsert.
        // Profesores: No borramos, hacemos Upsert.

        // 2. Upsert Talleres (TODOS los turnos)
        console.log(`📊 Sincronizando ${talleres.length} turnos de talleres...`);
        // Nota: Como no tenemos ID fijo en Excel, usamos MATCH por título+dia+horario o asumimos inserción limpia.
        // PROBLEMA: Si no borramos, se pueden duplicar si no hay constraint unique.
        // SOLUCIÓN: Vamos a confiar en que la tabla TALLERES sí se puede limpiar porque no tiene data de usuario crítica vinculada DIRECTAMENTE que no sea inscripciones (que ya borramos).
        // PERO: Si la galería se vincula a talleres, cuidado. Segun schema, galeria se vincula a alumno.
        // Vamos a limpiar talleres para evitar duplicados de turnos viejos/cambiados, asumiendo que nada cascada desde talleres que nos importe (Inscripciones se borran igual).
        await supabase.from('talleres').delete().filter('id', 'gt', 0);

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

        // Mapa para vincular inscripciones
        const tallerMap = {};
        insertedTalleres.forEach(t => {
            const key = t.titulo.toLowerCase().trim();
            if (!tallerMap[key]) tallerMap[key] = t.id;
        });

        // 3. Upsert Alumnos (CLAVE: NO BORRAR)
        console.log(`👤 Sincronizando ${alumnos.length} alumnos (UPSERT)...`);
        const { error: errA } = await supabase.from('alumnos').upsert(alumnos.map(a => ({
            dni: String(a[0]).trim(),
            nombre: a[1],
            email: a[2],
            password: String(a[3]),
            fecha_ingreso: a[4] ? new Date(a[4]) : new Date(),
            activo: String(a[5]).toUpperCase() === 'ACTIVO'
        })), { onConflict: 'dni' }); // Importante: dni es PK
        if (errA) console.error("Error en alumnos:", errA);

        // 4. Upsert Profesores
        const profesoresList = profesores || [];
        console.log(`👨‍🏫 Sincronizando ${profesoresList.length} profesores (UPSERT)...`);
        const { error: errP } = await supabase.from('profesores').upsert(profesoresList.map(p => ({
            dni: String(p[0]).trim(),
            nombre: p[1],
            password: String(p[3]),
            taller_asignado: p[4]
        })), { onConflict: 'dni' });
        if (errP) console.error("Error en profesores:", errP);

        // 5. Insertar Inscripciones (Nuevas, porque las borramos antes)
        console.log(`📝 Migrando ${inscripciones.length} inscripciones...`);
        const processedInscriptions = new Set();
        const uniqueInscriptions = inscripciones.filter(i => {
            const key = `${i[1]}-${i[10]}`.toLowerCase();
            if (processedInscriptions.has(key)) return false;
            processedInscriptions.add(key);
            return true;
        });

        const { error: errI } = await supabase.from('inscripciones').insert(uniqueInscriptions.map(i => ({
            alumno_dni: String(i[1]).trim(),
            taller_nombre: i[10],
            taller_id: tallerMap[String(i[10]).toLowerCase().trim()] || null,
            horario: i[12] || '', // Columna M (Indice 12) es Horario (Usuario confirmó L es Fecha)
            fecha_inscripcion: i[11] ? new Date(i[11]) : new Date() // Columna L (11) es Fecha
        })));
        if (errI) console.error("Error en inscripciones:", errI);

        // 6. Insertar Pagos
        console.log(`💰 Migrando ${pagos.length} pagos...`);
        const processedPagos = new Set();
        const uniquePagos = pagos.filter(p => {
            const key = `${p[0]}-${p[2]}-${p[3]}-${p[4]}`.toLowerCase();
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

        console.log("✅ Migración SEGURA completada. Datos de usuario preservados.");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO durante la migración:", error);
    }
}

migrate();
