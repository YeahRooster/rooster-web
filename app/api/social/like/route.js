import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function POST(request) {
    try {
        const { post_id, usuario_dni, usuario_nombre, autor_dni } = await request.json();

        if (!post_id || !usuario_dni) throw new Error("Faltan datos de like");

        // 1. Verificar si ya existe el like
        const { data: existingLike } = await supabase
            .from('social_likes')
            .select('*')
            .eq('post_id', post_id)
            .eq('usuario_dni', usuario_dni)
            .single();

        if (existingLike) {
            // REMOVER LIKE (Unlike)
            await supabase.from('social_likes').delete().eq('id', existingLike.id);
            return NextResponse.json({ status: 'success', action: 'unliked' });
        } else {
            // AGREGAR LIKE
            await supabase.from('social_likes').insert({
                post_id,
                usuario_dni
            });

            // 3. Crear notificación para el autor (si no es el mismo que likea)
            if (usuario_dni !== autor_dni) {
                await supabase.from('social_notifications').insert({
                    destinatario_dni: autor_dni,
                    actor_nombre: usuario_nombre,
                    post_id,
                    tipo: 'like'
                });
            }

            return NextResponse.json({ status: 'success', action: 'liked' });
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
