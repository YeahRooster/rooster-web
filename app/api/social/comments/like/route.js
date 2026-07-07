import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { comment_id, usuario_dni, usuario_nombre, autor_dni, post_id } = await request.json();

        if (!comment_id || !usuario_dni) {
            return NextResponse.json({ status: 'error', message: 'Faltan datos de like de comentario' }, { status: 400 });
        }

        // 0. Verificar si el usuario tiene acceso restringido
        const { data: studentCheck } = await supabaseAdmin
            .from('alumnos')
            .select('acceso_restringido')
            .eq('dni', usuario_dni)
            .single();

        if (studentCheck?.acceso_restringido) {
            return NextResponse.json({ status: 'error', message: 'Tu cuenta tiene el acceso restringido.' }, { status: 403 });
        }

        // 1. Verificar si ya existe el like
        const { data: existingLike } = await supabaseAdmin
            .from('gallery_comment_likes')
            .select('*')
            .eq('comment_id', comment_id)
            .eq('usuario_dni', usuario_dni)
            .maybeSingle();

        if (existingLike) {
            // REMOVER LIKE (Unlike)
            await supabaseAdmin.from('gallery_comment_likes').delete().eq('id', existingLike.id);
            return NextResponse.json({ status: 'success', action: 'unliked' });
        } else {
            // AGREGAR LIKE
            await supabaseAdmin.from('gallery_comment_likes').insert({
                comment_id,
                usuario_dni
            });

            // 3. Crear notificación para el autor del comentario (si no es el mismo que likea)
            if (autor_dni && post_id && usuario_dni !== autor_dni) {
                const { error: notifError } = await supabaseAdmin.from('social_notifications').insert({
                    destinatario_dni: autor_dni,
                    actor_nombre: usuario_nombre,
                    post_id,
                    tipo: 'like_comentario'
                });
                if (notifError) console.error("Error al notificar like de comentario:", notifError);
            }

            return NextResponse.json({ status: 'success', action: 'liked' });
        }

    } catch (error) {
        console.error('Comment Like Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
