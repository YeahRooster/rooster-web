import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Sugerir monto de pago según taller, fecha y método
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumno_dni = searchParams.get('alumno_dni');
        const fecha_pago = searchParams.get('fecha_pago') || new Date().toISOString().split('T')[0];
        const metodo_pago = searchParams.get('metodo_pago') || 'TRANSFERENCIA';

        // 1. Buscar inscripción del alumno
        const { data: inscripcion, error: inscErr } = await supabaseAdmin
            .from('inscripciones')
            .select('*, talleres(*)')
            .eq('alumno_dni', alumno_dni)
            .single();

        if (inscErr) throw inscErr;
        if (!inscripcion) {
            return NextResponse.json({ status: 'error', message: 'Alumno no inscrito' }, { status: 404 });
        }

        // 1.2 Buscar pagos realizados para saber cuál toca
        const { data: pagos, error: pagosErr } = await supabaseAdmin
            .from('pagos')
            .select('cuota_numero, estado')
            .eq('alumno_dni', alumno_dni)
            .neq('estado', 'pendiente'); // Solo pagos confirmados o pagados (ignorar pendientes si los hubiera)

        // Determinar siguiente cuota (Max pagada + 1)
        // Convertimos a números para asegurar (a veces viene como string)
        const cuotasPagadas = pagos?.map(p => parseInt(p.cuota_numero)) || [];
        const ultimaCuota = cuotasPagadas.length > 0 ? Math.max(...cuotasPagadas) : 0;
        const nextCuota = ultimaCuota + 1; // Si pagó la 1, toca la 2

        // 2. Obtener precios del taller
        const taller = inscripcion.talleres;

        // 3. Calcular FECHA DE LA CUOTA OBJETIVO
        let inicioCiclo = new Date(inscripcion.fecha_inicio_ciclo);
        // Fallback: Si no hay inicio de ciclo, asumimos Enero del año actual
        if (isNaN(inicioCiclo.getTime())) {
            inicioCiclo = new Date(new Date().getFullYear(), 0, 1);
        }

        const fechaCuotaObjetivo = new Date(inicioCiclo);
        fechaCuotaObjetivo.setMonth(inicioCiclo.getMonth() + (nextCuota - 1));

        // El vencimiento del descuento es el día 10 del MES DE LA CUOTA
        const dia10DelMesCuota = new Date(fechaCuotaObjetivo.getFullYear(), fechaCuotaObjetivo.getMonth(), 10);

        // Fecha actual de pago
        const fechaPagoReal = new Date(fecha_pago);

        // Lógica de descuento: ¿Estoy pagando ANTES del día 10 del mes de la cuota?
        const is_adelantado = fechaPagoReal < new Date(fechaCuotaObjetivo.getFullYear(), fechaCuotaObjetivo.getMonth(), 1);

        // Mes lejible
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mes_nombre = meses[fechaCuotaObjetivo.getMonth()];

        let monto_sugerido;
        let nota = '';

        if (metodo_pago.toUpperCase() === 'EFECTIVO') {
            monto_sugerido = taller.precio_desc_efectivo || taller.precio_base;
            nota = 'Precio con descuento por efectivo';
        } else if (fechaPagoReal <= dia10DelMesCuota) {
            monto_sugerido = taller.precio_desc_dia10 || taller.precio_base;
            nota = is_adelantado
                ? `Precio adelantado con descuento (${mes_nombre})`
                : `Precio con descuento (hasta el 10/${fechaCuotaObjetivo.getMonth() + 1})`;
        } else {
            monto_sugerido = taller.precio_base;
            nota = 'Precio base (después del día 10)';
        }

        return NextResponse.json({
            status: 'success',
            monto_sugerido,
            nota,
            taller: taller.titulo,
            cuota_numero: nextCuota,
            mes_nombre,
            is_adelantado,
            alumno: inscripcion.alumno_dni
        });

    } catch (error) {
        console.error('Error suggesting amount:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Función auxiliar para calcular número de cuota (1-12)
function calculateCuotaNumero(fecha_inicio_ciclo, fecha_pago) {
    if (!fecha_inicio_ciclo) return 1;

    const inicio = new Date(fecha_inicio_ciclo);
    const pago = new Date(fecha_pago);

    const mesesDiff = (pago.getFullYear() - inicio.getFullYear()) * 12 +
        (pago.getMonth() - inicio.getMonth());

    return Math.max(1, Math.min(12, mesesDiff + 1));
}
