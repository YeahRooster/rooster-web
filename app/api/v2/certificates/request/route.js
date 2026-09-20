import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, nombre, tipo, temario } = body; // tipo: 'regularity' o 'custom'

        if (!dni || !nombre || !tipo) {
            return NextResponse.json({ status: 'error', message: 'Datos incompletos' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .insert([{
                alumno_dni: dni,
                nombre_alumno: nombre,
                tipo,
                temario: temario || null
            }]);

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("Error creating certificate request:", error);
        return NextResponse.json({ status: 'error', message: 'Error interno' }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni) {
        return NextResponse.json({ status: 'error', message: 'DNI requerido' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .select('*')
            .eq('alumno_dni', dni)
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ status: 'success', requests: data });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json({ status: 'error', message: 'Error interno' }, { status: 500 });
    }
}
