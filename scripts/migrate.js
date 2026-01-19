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

        // 2. Upsert Talleres (Actualización inteligente para NO borrar precios)
        console.log(`📊 Sincronizando ${talleres.length} turnos ded talleres...`);
        // NO borramos la tabla. Iteramos y actualizamos si existe, o insertamos.

        for (const t of talleres) {
            const titulo = t[1];
            // Buscar si ya existe por título (asumimos título único por simplicidad o lo usamos como clave)
            // Nota: En DB tenemos unique constraint en titulo? No necesariamente, pero es lo mejor que tenemos.
            const { data: existing } = await supabase.from('talleres').select('id').eq('titulo', titulo).maybeSingle();

            const tallerData = {
                titulo: t[1],
                dia: t[2],
                horario: t[3],
                descripcion_corta: t[4],
                descripcion_larga: t[5],
                imagen_url: String(t[6]).trim(),
                cupos_totales: parseInt(t[7]) || 15,
                cupos_ocupados: parseInt(t[8]) || 0,
                activo: String(t[9]).toLowerCase() === 'si'
                // NO actualizamos precios_base, etc. para preservarlos
            };

            if (existing) {
                await supabase.from('talleres').update(tallerData).eq('id', existing.id);
            } else {
                await supabase.from('talleres').insert(tallerData);
            }
        }

        // Mapa para vincular inscripciones (re-fetch para tener IDs correctos)
        const { data: allTalleres } = await supabase.from('talleres').select('id, titulo');
        const tallerMap = {};
        allTalleres?.forEach(t => {
            tallerMap[t.titulo.toLowerCase().trim()] = t.id;
        });

        // 3. Upsert Alumnos (CLAVE: NO BORRAR)
        // PROTECCIÓN DE CONTRASEÑAS:
        // Buscamos alumnos existentes para NO pisar su password si ya existe en DB.
        const { data: existingAlumnos } = await supabase.from('alumnos').select('dni, password');
        const passwordMapAlumnos = {};
        existingAlumnos?.forEach(a => passwordMapAlumnos[a.dni] = a.password);

        console.log(`👤 Sincronizando ${alumnos.length} alumnos (UPSERT)...`);
        const { error: errA } = await supabase.from('alumnos').upsert(alumnos.map(a => ({
            dni: String(a[0]).trim(),
            nombre: a[1],
            email: a[2],
            // Si ya tiene password en DB, la mantenemos. Si no, usamos la del sheet.
            password: passwordMapAlumnos[String(a[0]).trim()] || String(a[3]),
            fecha_ingreso: a[4] ? new Date(a[4]) : new Date(),
            activo: String(a[5]).toUpperCase() === 'ACTIVO'
        })), {
            onConflict: 'dni',
            ignoreDuplicates: false // Actualizar si existe
        });
        if (errA) {
            console.error("⚠️ Error en alumnos:", errA);
            console.log("Tip: Revisá si hay emails duplicados en tu Google Sheets");
        }

        // 4. Upsert Profesores
        const profesoresList = profesores || [];
        // Mismo mecanismo para profesores
        const { data: existingProfes } = await supabase.from('profesores').select('dni, password');
        const passwordMapProfes = {};
        existingProfes?.forEach(p => passwordMapProfes[p.dni] = p.password);

        console.log(`👨‍🏫 Sincronizando ${profesoresList.length} profesores (UPSERT)...`);
        const { error: errP } = await supabase.from('profesores').upsert(profesoresList.map(p => ({
            dni: String(p[0]).trim(),
            nombre: p[1],
            // Si ya tiene password en DB, la mantenemos.
            password: passwordMapProfes[String(p[0]).trim()] || String(p[3]),
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
        // 6. Procesar PAGOS (Formato Horizontal)
        // Estructura: [DNI, Nombre, Taller, C1, C2...C12, Vencimiento]
        console.log(`💰 Procesando pagos horizontales (${pagos.length} alumnos)...`);

        const pagosParaInsertar = [];
        const actualizacionesInscripcion = [];

        for (const fila of pagos) {
            const dni = String(fila[0]).trim();
            const taller = fila[2];
            let vencimientoStr = fila[15]; // Columna P (índice 15) es INSCR_VENCE
            const anioSheet = parseInt(fila[16]); // Columna Q (índice 16) es AÑO (Antes estaba mal mapeado a 14)

            // Lógica Fallback de Fechas
            let fechaInicio, fechaVencimiento;

            if (vencimientoStr) {
                fechaVencimiento = new Date(vencimientoStr);
                if (!isNaN(fechaVencimiento.getTime())) {
                    fechaInicio = new Date(fechaVencimiento);
                    fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
                }
            }

            // Si no hay vencimiento válido, usamos el AÑO (Cols O)
            if ((!fechaVencimiento || isNaN(fechaVencimiento.getTime())) && anioSheet) {
                // Asumimos ciclo Enero - Diciembre del año indicado
                fechaInicio = new Date(anioSheet, 0, 1); // 1 Ene
                fechaVencimiento = new Date(anioSheet, 11, 31); // 31 Dic
                console.log(`⚠️ Alumno ${dni}: Usando año ${anioSheet} como fallback (Sin fecha exacta)`);
            }

            // Si logramos determinar fechas, procesamos
            if (fechaInicio && dni) {
                // Guardar para actualizar después
                actualizacionesInscripcion.push({
                    dni,
                    taller,
                    fecha_inicio_ciclo: fechaInicio,
                    fecha_vencimiento_ciclo: fechaVencimiento
                });

                // Procesar las 12 cuotas
                for (let i = 1; i <= 12; i++) {
                    const colIndex = 2 + i; // C1 está en índice 3 -> colIndex = 2+1
                    // Convertimos a string primero para limpiar caracteres raros (como $ o espacios)
                    const rawMonto = String(fila[colIndex]).replace(/[^0-9.]/g, '');
                    const monto = parseFloat(rawMonto);

                    if (monto > 0) { // Asumimos que si hay número > 0, está PAGADO o DEBE. 
                        // PERO en tu sheet: "1" o montos reales.
                        // Si pone "1", asumimos pagado simbólico? O solo montos reales?
                        // Si el usuario pone montos, guardamos eso.

                        // Calcular mes y año real de esta cuota
                        const fechaCuota = new Date(fechaInicio);
                        fechaCuota.setMonth(fechaInicio.getMonth() + (i - 1)); // Sumar meses

                        pagosParaInsertar.push({
                            alumno_dni: dni,
                            taller: taller,
                            mes: fechaCuota.getMonth() + 1, // 1-12
                            anio: fechaCuota.getFullYear(),
                            cuota_numero: i,
                            monto: monto,
                            monto_final: monto,
                            estado: 'pagado', // Lo que viene del sheet PAGOS se asume PAGADO
                            metodo_pago: 'MIGRACION',
                            fecha_pago: new Date() // Fecha aprox
                        });
                    }
                }
            }
        }

        // Insertar pagos en lotes
        if (pagosParaInsertar.length > 0) {
            console.log(`Guardando ${pagosParaInsertar.length} pagos individuales...`);
            const { error: errPag } = await supabase.from('pagos').upsert(pagosParaInsertar, {
                onConflict: 'alumno_dni,mes,anio,taller', // Evitar duplicados
                ignoreDuplicates: false
            });
            if (errPag) console.error("Error insertando pagos:", errPag);
        }

        // Actualizar fechas de ciclo en inscripciones
        if (actualizacionesInscripcion.length > 0) {
            console.log(`Actualizando ciclos de inscripción para ${actualizacionesInscripcion.length} alumnos...`);
            for (const upd of actualizacionesInscripcion) {
                await supabase.from('inscripciones')
                    .update({
                        fecha_inicio_ciclo: upd.fecha_inicio_ciclo,
                        fecha_vencimiento_ciclo: upd.fecha_vencimiento_ciclo,
                        estado_inscripcion: upd.fecha_vencimiento_ciclo > new Date() ? 'VIGENTE' : 'VENCIDA'
                    })
                    .eq('alumno_dni', upd.dni)
                // Intentar coincidir taller también si es posible, sino solo DNI (asumiendo 1 taller activo principal o iterando)
                //.ilike('taller_nombre', `%${upd.taller}%`); 
            }
        }

        console.log("✅ Migración SEGURA completada. Datos de usuario preservados.");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO durante la migración:", error);
    }
}

migrate();
