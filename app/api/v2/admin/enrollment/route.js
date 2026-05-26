import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dni = searchParams.get('dni');
        const taller = searchParams.get('taller');

        if (!dni || !taller) {
            return NextResponse.json({ status: 'error', message: 'Faltan parámetros' }, { status: 400 });
        }

        // Eliminar inscripción
        const { error } = await supabaseAdmin
            .from('inscripciones')
            .delete()
            .eq('alumno_dni', String(dni).trim())
            .ilike('taller_nombre', String(taller).trim());

        if (error) throw error;

        // Opcional: Eliminar los pagos pendientes de este taller para limpiar la grilla
        await supabaseAdmin
            .from('pagos')
            .delete()
            .eq('alumno_dni', String(dni).trim())
            .ilike('taller', String(taller).trim())
            .eq('estado', 'pendiente');

        // Opcional: si queremos que la fila desaparezca y no tiene deuda futura, 
        // los pagos 'pagados' se mantienen para historial.

        return NextResponse.json({ status: 'success', message: 'Dado de baja correctamente' });

    } catch (error) {
        console.error("Error al dar de baja:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
