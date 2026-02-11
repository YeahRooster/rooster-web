import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export const maxDuration = 60;

export async function POST(request) {
    try {
        console.log("🚀 Iniciando Sincronización desde la WEB...");

        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error("Error obteniendo datos de Sheets: " + result.message);
        }

        const { talleres, alumnos, profesores, inscripciones, pagos } = result.data;

        console.log("🧹 Limpiando base de datos para sincronización fresca...");
        const { error: pDelErr } = await supabaseAdmin.from('pagos').delete().neq('id', 0);
        if (pDelErr) throw new Error("Error limpiando pagos: " + pDelErr.message);

        const { error: iDelErr } = await supabaseAdmin.from('inscripciones').delete().neq('id', 0);
        if (iDelErr) throw new Error("Error limpiando inscripciones: " + iDelErr.message);

        for (const t of talleres) {
            const titulo = t[1];
            const dia = t[2];
            const horario = t[3];

            const { data: existing } = await supabaseAdmin.from('talleres')
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
            };

            if (existing) {
                await supabaseAdmin.from('talleres').update(tallerData).eq('id', existing.id);
            } else {
                await supabaseAdmin.from('talleres').insert(tallerData);
            }
        }

        const { data: allTalleres } = await supabaseAdmin.from('talleres').select('id, titulo');
        const tallerMap = {};
        allTalleres?.forEach(t => { tallerMap[t.titulo.toLowerCase().trim()] = t.id; });

        const { data: existingAlumnos } = await supabaseAdmin.from('alumnos').select('dni, password');
        const passwordMapAlumnos = {};
        existingAlumnos?.forEach(a => passwordMapAlumnos[a.dni] = a.password);

        const validAlumnosMap = new Map();
        alumnos.forEach(a => {
            const dni = String(a[0]).trim();
            if (!dni) return;
            const email = String(a[2] || "").trim();

            // Normalizar fecha de ingreso a las 12h UTC para evitar cambios de día por zona horaria
            let fechaIng = new Date();
            if (a[4]) {
                const parts = String(a[4]).split(/[-/]/);
                if (parts.length === 3) {
                    // Asumimos YYYY-MM-DD o DD-MM-YYYY dependiendo del formato de Sheets
                    // Para mayor seguridad parseamos y forzamos mediodía
                    const d = new Date(a[4]);
                    if (!isNaN(d.getTime())) {
                        fechaIng = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
                    }
                }
            }

            validAlumnosMap.set(dni, {
                dni: dni,
                nombre: a[1] || 'Sin Nombre',
                email: email === "" ? null : email,
                password: passwordMapAlumnos[dni] || String(a[3] || dni),
                fecha_ingreso: fechaIng,
                activo: String(a[5]).toUpperCase() === 'ACTIVO'
            });
        });

        // --- MANEJO DE DUPLICADOS DE EMAIL ---
        // Si hay DNIs con el mismo email, Supabase fallará. Debemos quedarnos con uno o limpiar el email.
        const emailsVistos = new Set();
        const listaAlumnosRobustos = Array.from(validAlumnosMap.values()).map(a => {
            if (a.email && emailsVistos.has(a.email.toLowerCase())) {
                console.warn(`⚠️ Email duplicado detectado para DNI ${a.dni}: ${a.email}. Se anula el email para este registro para permitir la carga.`);
                return { ...a, email: null };
            }
            if (a.email) emailsVistos.add(a.email.toLowerCase());
            return a;
        });

        const alumnosRobustosFinal = listaAlumnosRobustos;
        const { error: errA } = await supabaseAdmin.from('alumnos').upsert(alumnosRobustosFinal, { onConflict: 'dni' });
        if (errA) console.error("❌ Error upserting alumnos:", errA.message);

        // Obtener la lista real de DNIs existentes en Supabase (para filtrar huerfanos)
        const { data: dbAlumnos, error: dbAErr } = await supabaseAdmin.from('alumnos').select('dni');
        if (dbAErr) console.error("❌ Error fetching dbAlumnos:", dbAErr.message);
        const allowedDnis = new Set(dbAlumnos?.map(a => String(a.dni)) || []);
        console.log(`✅ DNIs permitidos en DB: ${allowedDnis.size}`);

        const { data: existingProfes } = await supabaseAdmin.from('profesores').select('dni, password');
        const passwordMapProfes = {};
        existingProfes?.forEach(p => passwordMapProfes[p.dni] = p.password);

        const validProfesMap = new Map();
        (profesores || []).forEach(p => {
            const dni = String(p[0]).trim();
            if (!dni) return;
            validProfesMap.set(dni, {
                dni: dni,
                nombre: p[1],
                password: passwordMapProfes[dni] || String(p[3] || "prof1"),
                taller_asignado: p[4]
            });
        });
        const { error: errP } = await supabaseAdmin.from('profesores').upsert(Array.from(validProfesMap.values()), { onConflict: 'dni' });
        if (errP) console.error("❌ Error upserting profesores:", errP.message);

        const uniqueInscMap = new Map();
        inscripciones.forEach(i => {
            const dni = String(i[1]).trim();
            const taller = String(i[10]).trim();
            if (!dni || !taller) return;
            const key = `${dni}-${taller}`.toLowerCase();

            // Normalizar fecha a UTC
            const d = i[11] ? new Date(i[11]) : new Date();
            const dateVal = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));

            if (!allowedDnis.has(dni)) {
                return;
            }

            uniqueInscMap.set(key, {
                alumno_dni: dni,
                taller_nombre: taller,
                taller_id: tallerMap[taller.toLowerCase()] || null,
                horario: i[12] || '',
                fecha_inscripcion: dateVal,
                fecha_inicio_ciclo: dateVal
            });
        });
        const { error: errI } = await supabaseAdmin.from('inscripciones').insert(Array.from(uniqueInscMap.values()));
        if (errI) console.error("❌ Error inserting inscripciones:", errI.message);
        else console.log(`✅ Inscripciones insertadas: ${uniqueInscMap.size}`);

        const pagosMap = new Map();
        for (const fila of pagos) {
            const dni = String(fila[0]).trim();
            const taller = fila[2];
            if (!dni || !taller) continue;

            const alumnoInfo = validAlumnosMap.get(dni);

            if (!allowedDnis.has(dni)) {
                continue;
            }

            const fechaIngresoAlumno = alumnoInfo ? new Date(alumnoInfo.fecha_ingreso) : null;

            const vencimientoStr = fila[15];
            const anioSheet = parseInt(fila[16]);
            let fechaInicioCiclo;

            if (vencimientoStr) {
                const fv = new Date(vencimientoStr);
                if (!isNaN(fv.getTime())) {
                    // Forzar UTC 12:00
                    fechaInicioCiclo = new Date(Date.UTC(fv.getUTCFullYear(), fv.getUTCMonth(), fv.getUTCDate(), 12, 0, 0));
                    fechaInicioCiclo.setUTCFullYear(fechaInicioCiclo.getUTCFullYear() - 1);
                }
            }
            if (!fechaInicioCiclo && anioSheet) {
                fechaInicioCiclo = new Date(Date.UTC(anioSheet, 0, 1, 12, 0, 0));
            }

            if (fechaInicioCiclo) {
                const hoy = new Date();
                const mesActualCal = hoy.getMonth() + 1;
                const anioActualCal = hoy.getFullYear();
                const estadoGral = String(fila[17] || "").toLowerCase();

                // Definimos el mes de inicio para el conteo de cuotas
                // Si el alumno ingresó después del inicio del ciclo, su cuota 1 es su mes de ingreso
                const mesInicioReal = fechaIngresoAlumno && fechaIngresoAlumno > fechaInicioCiclo
                    ? fechaIngresoAlumno
                    : fechaInicioCiclo;

                for (let i = 1; i <= 12; i++) {
                    const val = String(fila[2 + i] || "").trim();

                    const rawMonto = val.replace(/[^0-9.]/g, '');
                    const monto = parseFloat(rawMonto) || 0;

                    const fechaCuota = new Date(fechaInicioCiclo);
                    fechaCuota.setUTCMonth(fechaInicioCiclo.getUTCMonth() + (i - 1));
                    const mesCuota = fechaCuota.getUTCMonth() + 1;
                    const anioCuota = fechaCuota.getUTCFullYear();

                    // Comparamos el índice de mes total para mayor precisión
                    const indCuota = anioCuota * 12 + (mesCuota - 1);
                    const indIngreso = fechaIngresoAlumno
                        ? (fechaIngresoAlumno.getUTCFullYear() * 12 + fechaIngresoAlumno.getUTCMonth())
                        : 0;
                    const indHoy = anioActualCal * 12 + (mesActualCal - 1);

                    const esAnteriorAlIngreso = fechaIngresoAlumno && (indCuota < indIngreso);
                    const esMesFuturo = indCuota > indHoy;

                    // Calcular cuota personalizada (relativa al ingreso real)
                    let cuotaRelativa = i;
                    if (fechaIngresoAlumno) {
                        const diff = indCuota - indIngreso;
                        cuotaRelativa = diff + 1;
                    }

                    // CASO ESPECIAL: Si el usuario pone "-" significa que no asiste y no hay deuda
                    // O si el monto es 0 pero el mes es anterior al ingreso real del alumno.
                    if (val === "-" || (monto === 0 && esAnteriorAlIngreso)) {
                        if (val === "-") {
                            // Creamos un registro con estado 'excluido' para que no figure deuda
                            const pKey = `${dni}-${taller}-${mesCuota}-${anioCuota}`.toLowerCase();
                            pagosMap.set(pKey, {
                                alumno_dni: dni,
                                taller: taller,
                                mes: mesCuota,
                                anio: anioCuota,
                                cuota_numero: cuotaRelativa,
                                monto: 0,
                                monto_final: 0,
                                estado: 'excluido',
                                metodo_pago: 'MIGRACION',
                                fecha_pago: new Date()
                            });
                        }
                        continue;
                    }

                    // REGLA DE ORO: Solo creamos el registro si:
                    // 1. Tiene un monto pagado (metodo de pago MIGRACION)
                    // 2. NO es anterior al ingreso
                    // 3. NO es el mismo mes de ingreso con monto 0 (Para evitar deudas por anotarse a fin de mes)
                    // 4. NO es un mes futuro con monto 0

                    const esMesDeIngreso = (indCuota === indIngreso);

                    if (monto > 0 || (!esAnteriorAlIngreso && !esMesFuturo && !esMesDeIngreso)) {
                        let estadoFinal = (monto > 0) ? 'pagado' : 'pendiente';
                        if (mesCuota === mesActualCal && anioCuota === anioActualCal && estadoGral.includes('deud')) {
                            estadoFinal = 'pendiente';
                        }

                        if (cuotaRelativa <= 0 && monto === 0) continue;
                        if (cuotaRelativa <= 0 && monto > 0) cuotaRelativa = 1;

                        const pKey = `${dni}-${taller}-${mesCuota}-${anioCuota}`.toLowerCase();
                        pagosMap.set(pKey, {
                            alumno_dni: dni,
                            taller: taller,
                            mes: mesCuota,
                            anio: anioCuota,
                            cuota_numero: cuotaRelativa,
                            monto: monto,
                            monto_final: monto,
                            estado: estadoFinal,
                            metodo_pago: 'MIGRACION',
                            fecha_pago: new Date()
                        });
                    }
                }
            }
        }
        console.log(`💰 Pagos preparados para guardar: ${pagosMap.size}`);
        if (pagosMap.size > 0) {
            const { error: errPag } = await supabaseAdmin.from('pagos').upsert(Array.from(pagosMap.values()), { onConflict: 'alumno_dni,taller,mes,anio' });
            if (errPag) console.error("❌ Error upserting pagos:", errPag.message);
            else console.log(`✅ Pagos guardados con éxito.`);
        }

        return NextResponse.json({ status: 'success', message: `Sincronización completada. Alumnos: ${listaAlumnosRobustos.length}, Pagos: ${pagosMap.size}` });

    } catch (error) {
        console.error("❌ Error en Sync API:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
