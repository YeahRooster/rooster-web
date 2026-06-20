import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, taller, mes, anio, monto } = body;

        if (!dni || !taller || !mes || !anio || monto === undefined) {
            return NextResponse.json({ status: 'error', message: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const cleanDni = String(dni).trim();

        // Check if there is already a payment pending or if we need to insert a new one
        const { data: existingPayment } = await supabaseAdmin
            .from('pagos')
            .select('id')
            .eq('alumno_dni', cleanDni)
            .eq('taller', taller)
            .eq('mes', String(mes))
            .eq('anio', parseInt(anio))
            .maybeSingle();

        if (existingPayment) {
            // Update existing
            const { error: updErr } = await supabaseAdmin
                .from('pagos')
                .update({ 
                    estado: 'pagado', 
                    monto: parseFloat(monto), 
                    monto_final: parseFloat(monto),
                    fecha_pago: new Date().toISOString(),
                    fecha_real_pago: new Date().toISOString(),
                    cuota_numero: parseInt(mes)
                })
                .eq('id', existingPayment.id);
            if (updErr) throw updErr;
        } else {
            // Insert new
            const { error: insErr } = await supabaseAdmin
                .from('pagos')
                .insert({
                    alumno_dni: cleanDni,
                    taller,
                    mes: String(mes),
                    anio: parseInt(anio),
                    estado: 'pagado',
                    monto: parseFloat(monto),
                    monto_final: parseFloat(monto),
                    fecha_pago: new Date().toISOString(),
                    fecha_real_pago: new Date().toISOString(),
                    cuota_numero: parseInt(mes)
                });
            if (insErr) throw insErr;
        }

        return NextResponse.json({ status: 'success', message: 'Pago registrado correctamente' });
    } catch (error) {
        console.error("❌ Error en POST /api/v2/admin/payments/manual:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dni = searchParams.get('dni');
        const taller = searchParams.get('taller');
        const mes = searchParams.get('mes');
        const anio = searchParams.get('anio');

        if (!dni || !taller || !mes || !anio) {
            return NextResponse.json({ status: 'error', message: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const cleanDni = String(dni).trim();

        // Eliminar el pago o pasarlo a estado 'pendiente' (aquí lo borramos de la DB para deshacerlo completamente)
        const { error: delErr } = await supabaseAdmin
            .from('pagos')
            .delete()
            .eq('alumno_dni', cleanDni)
            .eq('taller', taller)
            .eq('mes', String(mes))
            .eq('anio', parseInt(anio));

        if (delErr) throw delErr;

        return NextResponse.json({ status: 'success', message: 'Pago deshecho correctamente' });
    } catch (error) {
        console.error("❌ Error en DELETE /api/v2/admin/payments/manual:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
