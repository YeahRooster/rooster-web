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

        // 1. Buscar TODAS las inscripciones del alumno
        const { data: inscripciones, error: inscErr } = await supabaseAdmin
            .from('inscripciones')
            .select('*, talleres(*)')
            .eq('alumno_dni', alumno_dni);

        if (inscErr) throw inscErr;
        if (!inscripciones || inscripciones.length === 0) {
            return NextResponse.json({ status: 'error', message: 'Alumno no inscrito' }, { status: 404 });
        }

        // 2. Buscar pagos para saber qué cuota toca en cada taller
        const { data: todosLosPagos } = await supabaseAdmin
            .from('pagos')
            .select('*')
            .eq('alumno_dni', alumno_dni)
            .neq('estado', 'pendiente');

        const fechaPagoActual = new Date(fecha_pago_str);

        // Procesar cada taller
        const allSugerencias = [];

        for (const insc of inscripciones) {
            const taller = insc.talleres;
            if (!taller) continue;

            // Filtrar pagos de este taller (solo los realizados/validados)
            const pagosTaller = todosLosPagos?.filter(p =>
                p.taller?.toLowerCase().trim() === taller.titulo?.toLowerCase().trim()
            ) || [];

            const paidCuotas = new Set(pagosTaller.map(p => parseInt(p.cuota_numero)));

            // Calcular fecha de inicio del ciclo
            let inicioCiclo = insc.fecha_inicio_ciclo ? new Date(insc.fecha_inicio_ciclo) : null;
            if (!inicioCiclo || isNaN(inicioCiclo.getTime()) || inicioCiclo.getFullYear() < 2000) {
                // Si no hay fecha de inicio, asumimos enero del año actual
                inicioCiclo = new Date(new Date().getFullYear(), 0, 1);
            }

            // ¿En qué cuota deberíamos estar hoy?
            // Calculamos la diferencia en meses entre inicio de ciclo y hoy
            const monthsDiff = (fechaPagoActual.getFullYear() - inicioCiclo.getFullYear()) * 12 + (fechaPagoActual.getMonth() - inicioCiclo.getMonth());
            const currentCuotaTarget = monthsDiff + 1; // La cuota que corresponde al mes actual

            const tallerSuggestions = [];

            // Función auxiliar para generar la sugerencia de una cuota específica
            const getSuggestionForCuota = (num) => {
                const baseDate = new Date(inicioCiclo.getFullYear(), inicioCiclo.getMonth(), 1);
                const fechaCuotaObjetivo = new Date(baseDate);
                fechaCuotaObjetivo.setMonth(baseDate.getMonth() + (num - 1));

                const mes_idx = fechaCuotaObjetivo.getMonth();
                const anio_pago = fechaCuotaObjetivo.getFullYear();
                const dia10DelMesCuota = new Date(anio_pago, mes_idx, 10);
                const is_adelantado = fechaPagoActual < new Date(anio_pago, mes_idx, 1);

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
                    const mes_nombre = meses[mes_idx];
                    nota = is_adelantado ? `Precio adelantado (${mes_nombre})` : `Precio con descuento (hasta el 10/${mes_idx + 1})`;
                } else {
                    monto_sugerido = taller.precio_base;
                    nota = 'Precio base (después del día 10)';
                }

                return {
                    taller: taller.titulo,
                    cuota_numero: num,
                    mes_nombre: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes_idx],
                    monto_sugerido,
                    nota,
                    is_adelantado
                };
            };

            // 1. Agregar todas las cuotas vencidas o actuales que no están pagadas
            for (let c = 1; c <= currentCuotaTarget; c++) {
                if (!paidCuotas.has(c)) {
                    tallerSuggestions.push(getSuggestionForCuota(c));
                }
            }

            // 2. Si el alumno está totalmente al día, sugerir la siguiente cuota (adelantada)
            if (tallerSuggestions.length === 0) {
                const ultimaCuotaPagada = paidCuotas.size > 0 ? Math.max(...Array.from(paidCuotas)) : 0;
                tallerSuggestions.push(getSuggestionForCuota(ultimaCuotaPagada + 1));
            }

            allSugerencias.push(...tallerSuggestions);
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
