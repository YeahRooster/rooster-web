import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export const maxDuration = 60; // 60 segundos por si el Sheets es lento (Vercel Hobby es 10s, Pro 300s)

export async function POST(request) {
    try {
        console.log("🚀 Iniciando Sincronización desde la WEB...");

        // 1. Obtener todos los datos de Google Sheets
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error("Error obteniendo datos de Sheets: " + result.message);
        }

        const { talleres, alumnos, profesores, inscripciones, pagos } = result.data;

        // --- LIMPIEZA TABLAS TRANSACCIONALES ---
        // Borramos pagos e inscripciones para regenerarlos (son el espejo del Excel)
        await supabaseAdmin.from('pagos').delete().neq('id', 0);
        await supabaseAdmin.from('inscripciones').delete().neq('id', 0);

        // 2. Sincronizar Talleres
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

        // Mapa para vincular inscripciones
        const { data: allTalleres } = await supabaseAdmin.from('talleres').select('id, titulo');
        const tallerMap = {};
        allTalleres?.forEach(t => { tallerMap[t.titulo.toLowerCase().trim()] = t.id; });

        // 3. Upsert Alumnos (Preservando Passwords)
        const { data: existingAlumnos } = await supabaseAdmin.from('alumnos').select('dni, password');
        const passwordMapAlumnos = {};
        existingAlumnos?.forEach(a => passwordMapAlumnos[a.dni] = a.password);

        const validAlumnosMap = new Map();
        alumnos.forEach(a => {
            const dni = String(a[0]).trim();
            if (!dni) return;
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
        await supabaseAdmin.from('alumnos').upsert(Array.from(validAlumnosMap.values()), { onConflict: 'dni' });

        // 4. Upsert Profesores
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
        await supabaseAdmin.from('profesores').upsert(Array.from(validProfesMap.values()), { onConflict: 'dni' });

        // 5. Insertar Inscripciones
        const uniqueInscMap = new Map();
        inscripciones.forEach(i => {
            const dni = String(i[1]).trim();
            const taller = String(i[10]).trim();
            if (!dni || !taller) return;
            const key = `${dni}-${taller}`.toLowerCase();
            uniqueInscMap.set(key, {
                alumno_dni: dni,
                taller_nombre: taller,
                taller_id: tallerMap[taller.toLowerCase()] || null,
                horario: i[12] || '',
                fecha_inscripcion: i[11] ? new Date(i[11]) : new Date()
            });
        });
        await supabaseAdmin.from('inscripciones').insert(Array.from(uniqueInscMap.values()));

        // 6. Procesar Pagos
        const pagosMap = new Map();
        for (const fila of pagos) {
            const dni = String(fila[0]).trim();
            const taller = fila[2];
            if (!dni || !taller) continue;

            const vencimientoStr = fila[15];
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
        await supabaseAdmin.from('pagos').upsert(Array.from(pagosMap.values()), { onConflict: 'alumno_dni,taller,mes,anio' });

        console.log("✅ Sincronización WEB Exitosa");
        return NextResponse.json({ status: 'success', message: 'Sincronización completada' });

    } catch (error) {
        console.error("❌ Error en Sync API:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
