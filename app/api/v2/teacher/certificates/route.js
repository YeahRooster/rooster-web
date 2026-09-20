import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { inscripcionId, certificadosData } = body;

        if (!inscripcionId) {
            return NextResponse.json({ status: 'error', message: 'ID de inscripción requerido' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('inscripciones')
            .update({ certificados_data: certificadosData })
            .eq('id', inscripcionId);

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("Error updating certificates data:", error);
        return NextResponse.json({ status: 'error', message: 'Error interno del servidor' }, { status: 500 });
    }
}
