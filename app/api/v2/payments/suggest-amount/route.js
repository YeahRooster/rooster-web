import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Sugerir monto de pago según taller, fecha y método
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumno_dni = searchParams.get('alumno_dni');
        const fecha_pago_str = searchParams.get('fecha_pago') || new Date().toISOString().split('T')[0];
        const metodo_pago = (searchParams.get('metodo_pago') || 'TRANSFERENCIA').toUpperCase();

        if (!alumno_dni) {
            return NextResponse.json({ status: 'error', message: 'Falta DNI' }, { status: 400 });
        }

        // 1. Buscar inscripciones (con datos del alumno) y pagos en paralelo
        const [inscRes, pagosRes] = await Promise.all([
            supabaseAdmin
                .from('inscripciones')
                .select('*, talleres(*), alumnos(fecha_ingreso)')
                .eq('alumno_dni', alumno_dni),
            supabaseAdmin
                .from('pagos')
                .select('*')
                .eq('alumno_dni', alumno_dni)
                .neq('estado', 'pendiente')
        ]);

        if (inscRes.error) throw inscRes.error;
        const inscripciones = inscRes.data;
        const todosLosPagos = pagosRes.data;

        if (!inscripciones || inscripciones.length === 0) {
            return NextResponse.json({ status: 'error', message: 'Alumno no inscrito' }, { status: 404 });
        }

        const fechaPagoActual = new Date(fecha_pago_str);

        // Procesar cada taller
        const allSugerencias = [];

        for (const insc of inscripciones) {
            const taller = insc.talleres;
            const alumno = insc.alumnos;
            if (!taller) continue;

            // Filtrar pagos de este taller (solo los realizados/validados)
            const pagosTaller = todosLosPagos?.filter(p =>
                p.taller?.toLowerCase().trim() === taller.titulo?.toLowerCase().trim()
            ) || [];

            const paidCuotas = new Set(pagosTaller.map(p => parseInt(p.cuota_numero)));

            // Calcular fecha de inicio del ciclo
            // Prioridad: El mayor entre (insc.fecha_inicio_ciclo || insc.fecha_inscripcion) y (alumno.fecha_ingreso)
            const rawInicio = insc.fecha_inicio_ciclo || insc.fecha_inscripcion;
            let inicioCiclo = rawInicio ? new Date(rawInicio) : null;
            const fechaIngreso = alumno?.fecha_ingreso ? new Date(alumno.fecha_ingreso) : null;

            // El ciclo para este alumno no puede empezar antes de que ingrese a la escuela
            if (fechaIngreso && (!inicioCiclo || fechaIngreso > inicioCiclo)) {
                inicioCiclo = fechaIngreso;
            }

            // REGLA: Forzamos que el ciclo empiece en Enero del año actual o del año de ingreso
            // para que la 'Cuota 0' sea siempre Enero, 'Cuota 1' Febrero, etc.
            const anioReferencia = inicioCiclo ? inicioCiclo.getFullYear() : new Date().getFullYear();
            inicioCiclo = new Date(anioReferencia, 0, 1);

            // ¿En qué cuota deberíamos estar hoy?
            const anioHoy = fechaPagoActual.getFullYear();
            const mesHoy = fechaPagoActual.getMonth() + 1;
            const indHoy = anioHoy * 12 + (mesHoy - 1);

            const indInicio = inicioCiclo.getUTCFullYear() * 12 + inicioCiclo.getUTCMonth();
            const monthsDiff = indHoy - indInicio;
            const currentCuotaTarget = monthsDiff + 1;

            const tallerSuggestions = [];

            // Función auxiliar para generar la sugerencia de una cuota específica
            const getSuggestionForCuota = (num) => {
                const mesCuotaOffset = (num - 1);
                // Calculamos anio y mes de la cuota objetivo
                const totalMonths = indInicio + mesCuotaOffset;
                const anioCuota = Math.floor(totalMonths / 12);
                const mesIdxCuota = totalMonths % 12;

                const dia10DelMesCuota = new Date(anioCuota, mesIdxCuota, 10);
                const is_adelantado = fechaPagoActual < new Date(anioCuota, mesIdxCuota, 1);

                let monto_sugerido;
                let nota = '';

                if (insc.monto_personalizado > 0) {
                    monto_sugerido = insc.monto_personalizado;
                    nota = 'Precio especial pactado';
                } else if (metodo_pago === 'EFECTIVO') {
                    monto_sugerido = taller.precio_desc_efectivo || taller.precio_base;
                    nota = 'Precio con descuento por efectivo';
                } else if (fechaPagoActual <= dia10DelMesCuota) {
                    monto_sugerido = taller.precio_desc_dia10 || taller.precio_base;
                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    const mes_nombre = meses[mesIdxCuota];
                    nota = is_adelantado ? `Precio adelantado (${mes_nombre})` : `Precio con descuento (hasta el 10/${mesIdxCuota + 1})`;
                } else {
                    monto_sugerido = taller.precio_base;
                    nota = 'Precio base (después del día 10)';
                }

                return {
                    taller: taller.titulo,
                    cuota_numero: num,
                    mes_nombre: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mesIdxCuota],
                    monto_sugerido,
                    nota,
                    is_adelantado
                };
            };

            // 1. Agregar todas las cuotas vencidas o actuales que no están pagadas
            for (let c = 0; c < currentCuotaTarget; c++) {
                if (!paidCuotas.has(c)) {
                    // Evitar sugerir cuotas previas al mes real de ingreso (indIngreso)
                    const indIngresoReal = fechaIngreso ? (fechaIngreso.getUTCFullYear() * 12 + fechaIngreso.getUTCMonth()) : 0;
                    const indCuotaC = indInicio + c;

                    if (indCuotaC >= indIngresoReal) {
                        tallerSuggestions.push(getSuggestionForCuota(c + 1));
                    }
                }
            }

            // 2. IMPORTANTE: Siempre sugerimos la cuota actual y la SIGUIENTE 
            // para que el botón de pago adelantado esté disponible
            const ultimaCuotaSync = paidCuotas.size > 0 ? Math.max(...Array.from(paidCuotas)) : (currentCuotaTarget - 1);

            // Sugerimos el mes siguiente al último pagado o al actual
            const proximaCuotaIdx = Math.max(currentCuotaTarget - 1, ultimaCuotaSync) + 1;

            if (!paidCuotas.has(proximaCuotaIdx)) {
                allSugerencias.push(getSuggestionForCuota(proximaCuotaIdx + 1));
            }
        }

        return NextResponse.json({
            status: 'success',
            taller: allSugerencias[0]?.taller,
            cuota_numero: allSugerencias[0]?.cuota_numero,
            mes_nombre: allSugerencias[0]?.mes_nombre,
            monto_sugerido: allSugerencias[0]?.monto_sugerido,
            nota: allSugerencias[0]?.nota,
            is_adelantado: allSugerencias[0]?.is_adelantado,
            items: allSugerencias,
            alumno_dni
        });

    } catch (error) {
        console.error('Error suggesting amount:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
