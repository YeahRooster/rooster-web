import { NextResponse } from 'next/server';
import { getSuggestedPayments } from '@/lib/payments';

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

        const result = await getSuggestedPayments({ alumno_dni, fecha_pago_str, metodo_pago });

        if (result.status === 'error') {
            return NextResponse.json({ status: 'error', message: result.message }, { status: result.code || 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error suggesting amount:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
