import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni) return NextResponse.json({ status: 'error', message: 'DNI requerido' }, { status: 400 });

    try {
        const { data: alumno, error: aErr } = await supabaseAdmin
            .from('alumnos')
            .select(`
                *,
                inscripciones (*),
                pagos (*)
            `)
            .eq('dni', dni)
            .single();

        if (aErr || !alumno) throw aErr;
        
        return NextResponse.json({ status: 'success', user: alumno });
    } catch (e) {
        console.error("SYNC ERR:", e);
        return NextResponse.json({ status: 'error', message: 'Error syncing user' }, { status: 500 });
    }
}
