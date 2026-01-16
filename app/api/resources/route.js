import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const taller = searchParams.get('taller');

    if (!taller) {
        return NextResponse.json({ status: 'error', message: 'Taller no especificado' }, { status: 400 });
    }

    try {
        console.log(`🔌 Consultando recursos en Supabase para: ${taller}`);

        const { data, error } = await supabase
            .from('recursos')
            .select('*')
            .eq('taller', taller)
            .order('fecha_subida', { ascending: false });

        if (error) throw error;

        // Formatear para que el frontend no sufra cambios
        const resources = data.map(r => ({
            nombre: r.nombre_archivo,
            url: r.url_archivo,
            fecha: new Date(r.fecha_subida).toLocaleDateString('es-AR')
        }));

        return NextResponse.json({ status: 'success', resources });
    } catch (error) {
        console.error("Error fetching resources from Supabase:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
