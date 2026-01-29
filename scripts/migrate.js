require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usamos SERVICE_ROLE_KEY para poder limpiar y cargar datos aunque el RLS esté activo
// Cae de vuelta a ANON_KEY por compatibilidad si no existe la otra
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URL del Script de Google (Actualizada a la v19+)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function migrate() {
    console.log("🚀 Iniciando migración de datos (MODO SINCRONIZACIÓN)...");

    try {
        // 1. Obtener todos los datos de Google Sheets
        console.log("📥 Extrayendo datos de Google Sheets...");
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const data = await response.json();
        console.log(`✅ Datos recibidos de Sheets: ${Object.keys(data.data || {}).join(', ')}`);

        if (data.status !== 'success') {
            throw new Error("Error obteniendo datos: " + data.message);
        }

        const { talleres, alumnos, profesores, inscripciones, pagos, recursos } = data.data;

        // --- LIMPIEZA / PREPARACIÓN ---
        console.log("🧹 MODO SINCRONIZACIÓN SEGURA (UPSERT)...");
        // YA NO BORRAMOS TABLAS MAESTRAS PARA NO PERDER DATOS DE USUARIO (Galería, Likes, etc.)
        // Solo limpiamos tablas transaccionales que se regeneran 100% del Excel
        // YA NO BORRAMOS 'recursos' para no perder lo subido por profes desde el panel web
        const { error: delPagErr } = await supabase.from('pagos').delete().neq('id', 0);
        const { error: delInsErr } = await supabase.from('inscripciones').delete().neq('id', 0);

        if (delPagErr) console.warn("⚠️ Advertencia al borrar pagos:", delPagErr.message);
        if (delInsErr) console.warn("⚠️ Advertencia al borrar inscripciones:", delInsErr.message);

        console.log("🧹 Tablas transaccionales limpias.");

        // 2. Upsert Talleres (Actualización inteligente para NO borrar precios)
        console.log(`📊 Sincronizando ${talleres.length} turnos ded talleres...`);
        // NO borramos la tabla. Iteramos y actualizamos si existe, o insertamos.

        for (const t of talleres) {
            const titulo = t[1];
            const dia = t[2];
            const horario = t[3];

            // Buscar si ya existe por combinación única: Título + Día + Horario
            const { data: existing } = await supabase.from('talleres')
                .select('id')
                .eq('titulo', titulo)
                .eq('dia', dia)
                .eq('horario', horario)
                .maybeSingle();

            const tallerData = {
                titulo,
                dia,
                horario,
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
        const { data: existingAlumnos } = await supabase.from('alumnos').select('dni, password');
        const passwordMapAlumnos = {};
        existingAlumnos?.forEach(a => passwordMapAlumnos[a.dni] = a.password);

        console.log(`👤 Procesando ${alumnos.length} filas de alumnos...`);
        const validAlumnosMap = new Map();
        alumnos.forEach(a => {
            const dni = String(a[0]).trim();
            if (dni === "") return;
            const email = String(a[2] || "").trim();
            validAlumnosMap.set(dni, {
                dni: dni,
                nombre: a[1] || 'Sin Nombre',
                email: email === "" ? null : email,
                password: passwordMapAlumnos[dni] || String(a[3] || dni),
                fecha_ingreso: a[4] ? new Date(a[4]) : new Date(),
                activo: String(a[5]).toUpperCase() === 'ACTIVO'
            });
        });

        const alumnosParaUpsert = Array.from(validAlumnosMap.values());
        console.log(`👤 Sincronizando ${alumnosParaUpsert.length} alumnos únicos...`);
        const { error: errA } = await supabase.from('alumnos').upsert(alumnosParaUpsert, { onConflict: 'dni' });

        if (errA) {
            console.error("⚠️ Error en alumnos:", errA.message);
            // Si hay un error de UNIQUE en el email, intentamos loguearlo
            if (errA.code === '23505') console.log("Tip: Hay emails duplicados en el Sheets.");
        } else {
            console.log("✅ Alumnos sincronizados.");
        }

        // 4. Upsert Profesores
        const profesoresList = profesores || [];
        const { data: existingProfes } = await supabase.from('profesores').select('dni, password');
        const passwordMapProfes = {};
        existingProfes?.forEach(p => passwordMapProfes[p.dni] = p.password);

        const validProfesMap = new Map();
        profesoresList.forEach(p => {
            const dni = String(p[0]).trim();
            if (dni === "") return;
            validProfesMap.set(dni, {
                dni: dni,
                nombre: p[1],
                password: passwordMapProfes[dni] || String(p[3] || "prof1"),
                taller_asignado: p[4]
            });
        });

        const profesParaUpsert = Array.from(validProfesMap.values());
        console.log(`👨‍🏫 Sincronizando ${profesParaUpsert.length} profesores únicos...`);
        const { error: errP } = await supabase.from('profesores').upsert(profesParaUpsert, { onConflict: 'dni' });
        if (errP) console.error("Error en profesores:", errP.message);

        // 5. Insertar Inscripciones
        console.log(`📝 Procesando ${inscripciones.length} filas de inscripciones...`);
        const uniqueInscMap = new Map();
        inscripciones.forEach(i => {
            const dni = String(i[1]).trim();
            const taller = String(i[10]).trim();
            if (dni === "" || taller === "") return;
            const key = `${dni}-${taller}`.toLowerCase();
            uniqueInscMap.set(key, {
                alumno_dni: dni,
                taller_nombre: taller,
                taller_id: tallerMap[taller.toLowerCase()] || null,
                horario: i[12] || '',
                fecha_inscripcion: i[11] ? new Date(i[11]) : new Date()
            });
        });

        const inscParaInsertar = Array.from(uniqueInscMap.values());
        console.log(`📝 Insertando ${inscParaInsertar.length} inscripciones únicas...`);
        const { error: errI } = await supabase.from('inscripciones').insert(inscParaInsertar);

        if (errI) {
            console.error("❌ Error en inscripciones:", errI.message);
            if (errI.code === '23503') console.log("Error: Registros refieren a DNIs que no existen en 'alumnos'.");
        } else {
            console.log("✅ Inscripciones sincronizadas.");
        }

        // 6. Procesar PAGOS
        console.log(`💰 Procesando pagos horizontales (${pagos.length} filas)...`);
        const pagosMap = new Map();
        const actualizacionesInscripcion = [];

        for (const fila of pagos) {
            const dni = String(fila[0]).trim();
            const taller = fila[2];
            if (!dni || !taller) continue;

            let vencimientoStr = fila[15];
            const anioSheet = parseInt(fila[16]);

            let fechaInicio, fechaVencimiento;
            if (vencimientoStr) {
                fechaVencimiento = new Date(vencimientoStr);
                if (!isNaN(fechaVencimiento.getTime())) {
                    fechaInicio = new Date(fechaVencimiento);
                    fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
                }
            }
            if ((!fechaVencimiento || isNaN(fechaVencimiento.getTime())) && anioSheet) {
                fechaInicio = new Date(anioSheet, 0, 1);
                fechaVencimiento = new Date(anioSheet, 11, 31);
            }

            if (fechaInicio) {
                actualizacionesInscripcion.push({ dni, taller, fechaInicio, fechaVencimiento });

                const hoy = new Date();
                const mesActualCal = hoy.getMonth() + 1;
                const anioActualCal = hoy.getFullYear();
                const estadoGral = String(fila[17] || "").toLowerCase();

                for (let i = 1; i <= 12; i++) {
                    const colIndex = 2 + i;
                    const rawMonto = String(fila[colIndex] || "").replace(/[^0-9.]/g, '');
                    const monto = parseFloat(rawMonto);

                    if (monto > 0 || i === 1) {
                        const fechaCuota = new Date(fechaInicio);
                        fechaCuota.setMonth(fechaInicio.getMonth() + (i - 1));
                        const mesCuota = fechaCuota.getMonth() + 1;
                        const anioCuota = fechaCuota.getFullYear();

                        let estadoFinal = (monto > 0) ? 'pagado' : 'pendiente';
                        if (mesCuota === mesActualCal && anioCuota === anioActualCal && estadoGral.includes('deud')) {
                            estadoFinal = 'pendiente';
                        }

                        // LLAVE ÚNICA PARA PAGOS: Alumno + Taller + Mes + Año
                        const pKey = `${dni}-${taller}-${mesCuota}-${anioCuota}`.toLowerCase();
                        pagosMap.set(pKey, {
                            alumno_dni: dni,
                            taller: taller,
                            mes: mesCuota,
                            anio: anioCuota,
                            cuota_numero: i,
                            monto: monto || 0,
                            monto_final: monto || 0,
                            estado: estadoFinal,
                            metodo_pago: 'MIGRACION',
                            fecha_pago: new Date()
                        });
                    }
                }
            }
        }

        const pagosFinal = Array.from(pagosMap.values());
        if (pagosFinal.length > 0) {
            console.log(`💰 Guardando ${pagosFinal.length} pagos únicos (UPSERT)...`);
            const { error: errPag } = await supabase.from('pagos').upsert(pagosFinal, {
                onConflict: 'alumno_dni,taller,mes,anio'
            });
            if (errPag) console.error("Error insertando pagos:", errPag.message);
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
