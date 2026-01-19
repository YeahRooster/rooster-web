import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dni = searchParams.get('dni');

        if (!dni) {
            return NextResponse.json({ status: 'error', message: 'DNI requerido' }, { status: 400 });
        }

        const { data: alumno, error } = await supabaseAdmin
            .from('alumnos')
            .select('dni, nombre, email, password, fecha_ingreso, activo')
            .eq('dni', dni)
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', data: alumno });
    } catch (error) {
        console.error('Error fetching student details:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
