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

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, taller_id } = body;

        if (!dni || !taller_id) {
            return NextResponse.json({ status: 'error', message: 'Faltan parámetros (dni y taller_id)' }, { status: 400 });
        }

        // 1. Verificar si ya está inscripto
        const { data: existing } = await supabaseAdmin
            .from('inscripciones')
            .select('*')
            .eq('alumno_dni', String(dni).trim())
            .eq('taller_id', taller_id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ status: 'error', message: 'El alumno ya está inscripto en este taller' }, { status: 400 });
        }

        // 2. Insertar inscripción
        const { error } = await supabaseAdmin
            .from('inscripciones')
            .insert({
                alumno_dni: String(dni).trim(),
                taller_id: taller_id
            });

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Alumno inscripto correctamente' });

    } catch (error) {
        console.error("Error al inscribir alumno:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
