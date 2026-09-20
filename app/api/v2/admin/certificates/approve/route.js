import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .update({ estado: 'APROBADO', fecha_aprobacion: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("Error approving request:", error);
        return NextResponse.json({ status: 'error', message: 'Error interno' }, { status: 500 });
    }
}
