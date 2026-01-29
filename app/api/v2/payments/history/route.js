import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Historial de pagos (vista horizontal)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const taller_filter = searchParams.get('taller');

        // Obtener todas las inscripciones con sus alumnos
        let query = supabaseAdmin
            .from('inscripciones')
            .select(`
                *,
                alumnos(dni, nombre, email, pais),
                talleres(id, titulo)
            `);

        if (taller_filter) {
            query = query.eq('taller', taller_filter);
        }

        const { data: inscripciones, error: inscErr } = await query;
        if (inscErr) throw inscErr;

        // Para cada inscripción, obtener sus pagos
        const result = await Promise.all(inscripciones.map(async (insc) => {
            const { data: pagos, error: pagosErr } = await supabaseAdmin
                .from('pagos')
                .select('*')
                .eq('alumno_dni', insc.alumno_dni)
                .order('cuota_numero');

            if (pagosErr) console.error('Error fetching pagos:', pagosErr);

            // Organizar pagos por cuota (1-12)
            const pagosPorCuota = Array(12).fill(null).map((_, idx) => {
                const pago = pagos?.find(p => p.cuota_numero === idx + 1);
                return pago ? {
                    pagado: pago.estado === 'pagado',
                    monto: pago.monto_final || pago.monto,
                    fecha: pago.fecha_real_pago || pago.fecha_pago,
                    metodo: pago.metodo_pago
                } : { pagado: false };
            });

            return {
                id: insc.id,
                alumno_dni: insc.alumnos.dni,
                alumno_nombre: insc.alumnos.nombre,
                alumno_pais: insc.alumnos.pais,
                monto_personalizado: insc.monto_personalizado || 0,
                taller: insc.talleres?.titulo || insc.taller,
                fecha_inicio_ciclo: insc.fecha_inicio_ciclo,
                fecha_vencimiento_ciclo: insc.fecha_vencimiento_ciclo,
                estado_inscripcion: insc.estado_inscripcion,
                pagos: pagosPorCuota
            };
        }));

        return NextResponse.json({ status: 'success', alumnos: result });

    } catch (error) {
        console.error('Error fetching payments history:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Registrar nuevo pago
export async function POST(request) {
    try {
        const { alumno_dni, fecha_pago, metodo_pago, monto_final, cuota_numero, observaciones } = await request.json();

        const { error } = await supabaseAdmin
            .from('pagos')
            .insert({
                alumno_dni,
                mes: new Date(fecha_pago).getMonth() + 1,
                anio: new Date(fecha_pago).getFullYear(),
                monto: monto_final, // Campo legacy
                monto_final,
                estado: 'pagado',
                cuota_numero,
                fecha_real_pago: fecha_pago,
                metodo_pago,
                observaciones
            });

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Pago registrado correctamente' });

    } catch (error) {
        console.error('Error registering payment:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
