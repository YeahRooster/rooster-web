import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { dni, newPassword, role } = await request.json();

        if (!dni || !newPassword || !role) {
            return NextResponse.json({ status: 'error', message: 'Faltan datos' }, { status: 400 });
        }

        const table = role === 'teacher' ? 'profesores' : 'alumnos';

        // 1. Actualizar en Supabase
        const { error: dbErr } = await supabaseAdmin
            .from(table)
            .update({ password: newPassword })
            .eq('dni', dni);

        if (dbErr) throw dbErr;

        return NextResponse.json({ status: 'success', message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
