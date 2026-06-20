import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { dni, taller, mes, anio } = await request.json();

        if (!dni || !taller || !mes || !anio) {
            return NextResponse.json({ status: 'error', message: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const cleanDni = String(dni).trim();

        // Buscar el pago existente
        const { data: existingPayment, error: fetchErr } = await supabaseAdmin
            .from('pagos')
            .select('id')
            .eq('alumno_dni', cleanDni)
            .eq('taller', taller)
            .eq('mes', String(mes))
            .eq('anio', parseInt(anio))
            .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existingPayment) {
            // Actualizar a estado pendiente y limpiar fechas
            const { error: updErr } = await supabaseAdmin
                .from('pagos')
                .update({ 
                    estado: 'pendiente', 
                    fecha_pago: null,
                    fecha_real_pago: null
                })
                .eq('id', existingPayment.id);
            if (updErr) throw updErr;
            
            return NextResponse.json({ status: 'success', message: 'Pago desmarcado correctamente' });
        } else {
            return NextResponse.json({ status: 'error', message: 'No se encontró el registro de pago' }, { status: 404 });
        }

    } catch (error) {
        console.error("❌ Error en POST /api/v2/admin/payments/undo:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
