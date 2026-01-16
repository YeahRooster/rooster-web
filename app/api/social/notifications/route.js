import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni) return NextResponse.json({ status: 'error', message: 'DNI requerido' }, { status: 400 });

    try {
        const { data, error } = await supabase
            .from('social_notifications')
            .select('*')
            .eq('destinatario_dni', dni)
            .order('fecha', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Marcar como leídas
export async function PUT(request) {
    try {
        const { dni } = await request.json();
        await supabase.from('social_notifications')
            .update({ leida: true })
            .eq('destinatario_dni', dni);

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
