import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { post_id, alumno_dni } = await request.json();

        if (!post_id || !alumno_dni) {
            return NextResponse.json({ status: 'error', message: 'Faltan datos' }, { status: 400 });
        }

        // Check if student has acceso_restringido
        const { data: student } = await supabaseAdmin.from('alumnos').select('acceso_restringido').eq('dni', alumno_dni).single();
        if (student?.acceso_restringido) {
            return NextResponse.json({ status: 'error', message: 'Acceso restringido' }, { status: 403 });
        }

        // Toggle Like
        const { data: existing } = await supabaseAdmin
            .from('comunidad_likes')
            .select('*')
            .eq('post_id', post_id)
            .eq('alumno_dni', alumno_dni)
            .maybeSingle();

        if (existing) {
            // Remove like
            await supabaseAdmin.from('comunidad_likes').delete().eq('post_id', post_id).eq('alumno_dni', alumno_dni);
            return NextResponse.json({ status: 'success', action: 'unliked' });
        } else {
            // Add like
            await supabaseAdmin.from('comunidad_likes').insert({ post_id, alumno_dni });
            return NextResponse.json({ status: 'success', action: 'liked' });
        }
    } catch (error) {
        console.error("Error toggle like:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumno_dni = searchParams.get('alumno_dni');

        if (!alumno_dni) return NextResponse.json({ status: 'error', message: 'Falta dni' }, { status: 400 });

        const { data: likes, error } = await supabaseAdmin
            .from('comunidad_likes')
            .select('post_id')
            .eq('alumno_dni', alumno_dni);

        if (error) throw error;

        return NextResponse.json({ status: 'success', likes: likes.map(l => l.post_id) });
    } catch (error) {
        console.error("Error GET likes:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
