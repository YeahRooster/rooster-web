import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Obtener todos los talleres con sus precios
export async function GET() {
    try {
        const { data: talleres, error } = await supabaseAdmin
            .from('talleres')
            .select('id, titulo, precio_base, precio_desc_dia10, precio_desc_efectivo, precio_por_hora, tipo_cobro')
            .order('titulo');

        if (error) throw error;

        return NextResponse.json({ status: 'success', talleres });
    } catch (error) {
        console.error('Error fetching talleres prices:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// PUT: Actualizar precios de un taller (Admin edita cada 2-3 meses)
export async function PUT(request) {
    try {
        const { taller_id, precio_base, precio_desc_dia10, precio_desc_efectivo, precio_por_hora } = await request.json();

        const { error } = await supabaseAdmin
            .from('talleres')
            .update({
                precio_base,
                precio_desc_dia10,
                precio_desc_efectivo,
                precio_por_hora
            })
            .eq('id', taller_id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Precios actualizados correctamente' });
    } catch (error) {
        console.error('Error updating prices:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
