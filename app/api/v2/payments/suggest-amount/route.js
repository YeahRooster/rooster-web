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
        const sugerencias = inscripciones.map(insc => {
            const taller = insc.talleres;
            if (!taller) return null;

            // Filtrar pagos de este taller
            const pagosTaller = todosLosPagos?.filter(p =>
                p.taller?.toLowerCase().trim() === taller.titulo?.toLowerCase().trim()
            ) || [];

            const ultimaCuota = pagosTaller.length > 0 ? Math.max(...pagosTaller.map(p => parseInt(p.cuota_numero) || 0)) : 0;
            const nextCuota = ultimaCuota + 1;

            // Calcular fecha de la cuota objetivo
            // Fallback robusto para fechas nulas o mal formadas
            let inicioCiclo = insc.fecha_inicio_ciclo ? new Date(insc.fecha_inicio_ciclo) : null;
            if (!inicioCiclo || isNaN(inicioCiclo.getTime()) || inicioCiclo.getFullYear() < 2000) {
                inicioCiclo = new Date(new Date().getFullYear(), 0, 1);
            }

            // Usamos el día 1 para evitar problemas con meses de 28/30/31 días
            const baseDate = new Date(inicioCiclo.getFullYear(), inicioCiclo.getMonth(), 1);
            const fechaCuotaObjetivo = new Date(baseDate);
            fechaCuotaObjetivo.setMonth(baseDate.getMonth() + (nextCuota - 1));

            const mes_idx = fechaCuotaObjetivo.getMonth();
            const anio_pago = fechaCuotaObjetivo.getFullYear();
            const dia10DelMesCuota = new Date(anio_pago, mes_idx, 10);

            // ¿Es adelantado? (Pago antes del mes de la cuota)
            const is_adelantado = fechaPagoActual < new Date(anio_pago, mes_idx, 1);

            let monto_sugerido;
            let nota = '';

            // --- PRIORIDAD 1: MONTO PERSONALIZADO ---
            if (insc.monto_personalizado > 0) {
                monto_sugerido = insc.monto_personalizado;
                nota = 'Precio especial pactado';
            }
            // --- PRIORIDAD 2: EFECTIVO ---
            else if (metodo_pago === 'EFECTIVO') {
                monto_sugerido = taller.precio_desc_efectivo || taller.precio_base;
                nota = 'Precio con descuento por efectivo';
            }
            // --- PRIORIDAD 3: TRANSFERENCIA ANTES DEL 10 ---
            else if (fechaPagoActual <= dia10DelMesCuota) {
                monto_sugerido = taller.precio_desc_dia10 || taller.precio_base;
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const mes_nombre = meses[mes_idx];

                nota = is_adelantado
                    ? `Precio adelantado con descuento (${mes_nombre})`
                    : `Precio con descuento (hasta el 10/${mes_idx + 1})`;
            }
            // --- FALLBACK: PRECIO BASE ---
            else {
                monto_sugerido = taller.precio_base;
                nota = 'Precio base (después del día 10)';
            }

            return {
                taller: taller.titulo,
                cuota_numero: nextCuota,
                mes_nombre: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes_idx],
                monto_sugerido,
                nota,
                is_adelantado
            };
        }).filter(s => s !== null);

        // Para compatibilidad con el frontend que espera un objeto único, 
        // devolvemos la primera sugerencia pero incluimos el array 'items' por si acaso.
        return NextResponse.json({
            status: 'success',
            ...sugerencias[0],
            items: sugerencias,
            alumno_dni
        });

    } catch (error) {
        console.error('Error suggesting amount:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
