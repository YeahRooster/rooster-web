import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

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

        // 2. Espejar en Google Sheets (Opcional pero recomendado para consistencia)
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'changePassword',
                    dni: dni,
                    password: newPassword,
                    role: role
                })
            });
            console.log("✅ Contraseña espejada en Google Sheets");
        } catch (gasErr) {
            console.error("⚠️ Error espejando en GAS:", gasErr);
            // No bloqueamos la respuesta al usuario si GAS falla
        }

        return NextResponse.json({ status: 'success', message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
