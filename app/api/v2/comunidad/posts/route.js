import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Obtener posts de la comunidad
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeHidden = searchParams.get('includeHidden') === 'true'; // Solo admin/profes verían ocultos

        let query = supabaseAdmin
            .from('comunidad_posts')
            .select(`
                *,
                comunidad_likes ( count ),
                comunidad_comments ( count )
            `)
            .order('fecha_publicacion', { ascending: false });

        if (!includeHidden) {
            query = query.eq('oculto', false).lte('fecha_publicacion', new Date().toISOString());
        }

        const { data: posts, error } = await query;

        if (error) throw error;

        // Formatear la respuesta
        const formattedPosts = posts.map(post => ({
            ...post,
            likes_count: post.comunidad_likes[0]?.count || 0,
            comments_count: post.comunidad_comments[0]?.count || 0
        }));

        return NextResponse.json({ status: 'success', posts: formattedPosts });
    } catch (error) {
        console.error("Error GET comunidad/posts:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Crear nuevo post (Profe o Admin)
export async function POST(request) {
    try {
        const body = await request.json();
        const { titulo, contenido, imagenes, autor_nombre, autor_dni, autor_rol, fecha_publicacion } = body;

        if (!titulo || !contenido || !autor_dni) {
            return NextResponse.json({ status: 'error', message: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('comunidad_posts')
            .insert({
                titulo,
                contenido,
                imagenes: imagenes || [], // Array de URLs
                autor_nombre,
                autor_dni,
                autor_rol: autor_rol || 'profesor',
                fecha_publicacion: fecha_publicacion || new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', post: data });
    } catch (error) {
        console.error("Error POST comunidad/posts:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// PUT: Ocultar o editar post (Admin)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, oculto } = body;

        if (!id) {
            return NextResponse.json({ status: 'error', message: 'Falta el ID del post' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('comunidad_posts')
            .update({ oculto })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', post: data });
    } catch (error) {
        console.error("Error PUT comunidad/posts:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar post (Admin)
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ status: 'error', message: 'Falta ID' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('comunidad_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Post eliminado' });
    } catch (error) {
        console.error("Error DELETE comunidad/posts:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
