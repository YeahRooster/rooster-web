import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const post_id = searchParams.get('post_id');

        if (!post_id) return NextResponse.json({ status: 'error', message: 'Falta post_id' }, { status: 400 });

        const { data: comments, error } = await supabaseAdmin
            .from('comunidad_comments')
            .select(`
                id,
                comentario,
                created_at,
                alumnos ( nombre, avatar_id, avatar_url )
            `)
            .eq('post_id', post_id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ status: 'success', comments });
    } catch (error) {
        console.error("Error GET comments:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { post_id, alumno_dni, comentario } = await request.json();

        if (!post_id || !alumno_dni || !comentario) {
            return NextResponse.json({ status: 'error', message: 'Faltan datos' }, { status: 400 });
        }

        // Check restriction
        const { data: student } = await supabaseAdmin.from('alumnos').select('acceso_restringido').eq('dni', alumno_dni).single();
        if (student?.acceso_restringido) {
            return NextResponse.json({ status: 'error', message: 'Acceso restringido' }, { status: 403 });
        }

        // Check banned words
        const { data: bannedWordsData } = await supabaseAdmin.from('banned_words').select('word');
        const bannedWords = bannedWordsData ? bannedWordsData.map(bw => bw.word.toLowerCase()) : [];
        const commentLower = comentario.toLowerCase();
        
        const isBanned = bannedWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(commentLower);
        });

        if (isBanned) {
            return NextResponse.json({ status: 'error', message: 'El comentario contiene palabras no permitidas.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('comunidad_comments')
            .insert({ post_id, alumno_dni, comentario: comentario.trim() })
            .select(`
                id,
                comentario,
                created_at,
                alumnos ( nombre, avatar_id, avatar_url )
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', comment: data });
    } catch (error) {
        console.error("Error POST comment:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
