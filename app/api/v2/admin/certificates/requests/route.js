import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    try {
        const { data, error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .select('*')
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ status: 'success', requests: data });
    } catch (error) {
        console.error("Error fetching admin requests:", error);
        return NextResponse.json({ status: 'error', message: 'Error interno' }, { status: 500 });
    }
}
