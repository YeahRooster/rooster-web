import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Obtener todos los talleres con sus precios
export async function GET() {
    try {
        const { data: talleres, error } = await supabaseAdmin
            .from('talleres')
            .select('id, titulo, precio_base, precio_desc_dia10, precio_desc_efectivo, precio_por_hora, tipo_cobro, comision, activo')
            .order('titulo');

        if (error) throw error;

        return NextResponse.json({ status: 'success', talleres });
    } catch (error) {
        console.error('Error fetching talleres prices:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// PUT: Actualizar precios o visibilidad de un taller
export async function PUT(request) {
    try {
        const body = await request.json();
        const { taller_id, precio_base, precio_desc_dia10, precio_desc_efectivo, precio_por_hora, activo } = body;

        const updateData = {};
        if (precio_base !== undefined) updateData.precio_base = precio_base;
        if (precio_desc_dia10 !== undefined) updateData.precio_desc_dia10 = precio_desc_dia10;
        if (precio_desc_efectivo !== undefined) updateData.precio_desc_efectivo = precio_desc_efectivo;
        if (precio_por_hora !== undefined) updateData.precio_por_hora = precio_por_hora;
        if (activo !== undefined) updateData.activo = activo;

        const { error } = await supabaseAdmin
            .from('talleres')
            .update(updateData)
            .eq('id', taller_id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Precios actualizados correctamente' });
    } catch (error) {
        console.error('Error updating prices:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
