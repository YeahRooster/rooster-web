import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Listar retos (Admin)
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Crear nuevo reto
export async function POST(request) {
    try {
        const body = await request.json();
        const { titulo, descripcion, talleres_participantes, fecha_inicio, fecha_cierre_subida, fecha_cierre_votacion } = body;

        // Validaciones básicas
        if (!titulo || !fecha_inicio || !fecha_cierre_subida || !fecha_cierre_votacion) {
            return NextResponse.json({ status: 'error', message: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('challenges')
            .insert([{
                titulo,
                descripcion,
                talleres_participantes,
                fecha_inicio,
                fecha_cierre_subida,
                fecha_cierre_votacion
            }])
            .select()
            .single();

        if (error) throw error;

        // NOTIFICACIÓN: Enviar broadcast a los alumnos de los talleres seleccionados
        // El frontend se encargará de esto o podemos dispararlo aquí. 
        // Por ahora, devolvemos el éxito.

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// PUT: Editar reto (ej. cambiar ganador o fechas)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('challenges')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar reto
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('challenges')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Reto eliminado' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
