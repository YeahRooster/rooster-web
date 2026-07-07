import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Obtener todas las palabras censuradas
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('banned_words')
            .select('*')
            .order('word', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Agregar una nueva palabra censurada
export async function POST(request) {
    try {
        const { word, admin_dni } = await request.json();

        if (admin_dni !== '999') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 403 });
        }

        if (!word || word.trim() === '') {
            return NextResponse.json({ status: 'error', message: 'La palabra no puede estar vacía' }, { status: 400 });
        }

        const cleanWord = word.trim().toLowerCase();

        const { data, error } = await supabaseAdmin
            .from('banned_words')
            .insert({ word: cleanWord })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ status: 'error', message: 'La palabra ya existe en la lista' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar una palabra censurada
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const admin_dni = searchParams.get('admin_dni');

        if (admin_dni !== '999') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 403 });
        }

        if (!id) {
            return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('banned_words')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Palabra eliminada' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
