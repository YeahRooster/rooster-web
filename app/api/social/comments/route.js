import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Obtener comentarios de un post con sus likes
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const post_id = searchParams.get('post_id');

        if (!post_id) {
            return NextResponse.json({ status: 'error', message: 'post_id requerido' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('gallery_comments')
            .select(`
                *,
                gallery_comment_likes (usuario_dni)
            `)
            .eq('post_id', post_id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Aplanar datos: agregar conteo de likes
        const comments = data.map(c => ({
            ...c,
            likesCount: c.gallery_comment_likes?.length || 0,
            likedBy: c.gallery_comment_likes?.map(l => l.usuario_dni) || []
        }));

        return NextResponse.json({ status: 'success', data: comments });

    } catch (error) {
        console.error('Comments GET error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Crear un nuevo comentario
export async function POST(request) {
    try {
        const { post_id, autor_dni, autor_nombre, texto } = await request.json();

        if (!post_id || !autor_dni || !autor_nombre || !texto?.trim()) {
            return NextResponse.json({ status: 'error', message: 'Faltan datos requeridos' }, { status: 400 });
        }

        if (texto.trim().length > 500) {
            return NextResponse.json({ status: 'error', message: 'El comentario no puede superar los 500 caracteres' }, { status: 400 });
        }

        // Verificar palabras censuradas en el comentario
        const { data: bannedWords } = await supabaseAdmin.from('banned_words').select('word');
        if (bannedWords && bannedWords.length > 0) {
            const textToCheck = texto.toLowerCase();
            const found = bannedWords.find(bw => textToCheck.includes(bw.word.toLowerCase()));
            if (found) {
                return NextResponse.json({
                    status: 'error',
                    message: 'Tu comentario contiene palabras no permitidas.'
                }, { status: 400 });
            }
        }

        // Verificar que el post existe y está activo
        const { data: post, error: postErr } = await supabaseAdmin
            .from('social_posts')
            .select('id, alumno_dni, alumno_nombre')
            .eq('id', post_id)
            .eq('status', 'active')
            .single();

        if (postErr || !post) {
            return NextResponse.json({ status: 'error', message: 'Post no encontrado' }, { status: 404 });
        }

        // Verificar acceso restringido del alumno
        const { data: studentCheck } = await supabaseAdmin
            .from('alumnos')
            .select('acceso_restringido')
            .eq('dni', autor_dni)
            .single();

        if (studentCheck?.acceso_restringido) {
            return NextResponse.json({ status: 'error', message: 'Tu cuenta tiene el acceso restringido.' }, { status: 403 });
        }

        // Insertar el comentario
        const { data: comment, error } = await supabaseAdmin
            .from('gallery_comments')
            .insert({
                post_id,
                autor_dni,
                autor_nombre,
                texto: texto.trim()
            })
            .select()
            .single();

        if (error) throw error;

        // Notificar al autor de la foto (si no es el mismo que comenta)
        if (autor_dni !== post.alumno_dni) {
            const { error: notifError } = await supabaseAdmin.from('social_notifications').insert({
                destinatario_dni: post.alumno_dni,
                actor_nombre: autor_nombre,
                post_id,
                tipo: 'comentario'
            });
            if (notifError) console.error("Error al notificar comentario:", notifError);
        }

        return NextResponse.json({
            status: 'success',
            data: { ...comment, likesCount: 0, likedBy: [] }
        });

    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar un comentario (solo el autor o admin)
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const dni = searchParams.get('dni');

        if (!id || !dni) {
            return NextResponse.json({ status: 'error', message: 'id y dni requeridos' }, { status: 400 });
        }

        // Obtener el comentario para verificar autoría
        const { data: comment, error: fetchErr } = await supabaseAdmin
            .from('gallery_comments')
            .select('autor_dni')
            .eq('id', id)
            .single();

        if (fetchErr || !comment) {
            return NextResponse.json({ status: 'error', message: 'Comentario no encontrado' }, { status: 404 });
        }

        // Solo el autor o el admin (dni=999) pueden borrar
        if (comment.autor_dni !== dni && dni !== '999') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .from('gallery_comments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Comentario eliminado' });

    } catch (error) {
        console.error('Comments DELETE error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
