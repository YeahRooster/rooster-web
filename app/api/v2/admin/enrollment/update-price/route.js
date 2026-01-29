import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function PUT(request) {
    try {
        const { inscripcion_id, monto_personalizado } = await request.json();

        if (!inscripcion_id) {
            return NextResponse.json({ status: 'error', message: 'Falta ID de inscripción' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('inscripciones')
            .update({ monto_personalizado: parseFloat(monto_personalizado) || 0 })
            .eq('id', inscripcion_id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Precio personalizado actualizado' });

    } catch (error) {
        console.error('Error updating custom price:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
