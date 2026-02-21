import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active'; // 'active' por defecto

        // Obtener posts con cuenta de likes (vía join lateral o conteo simple)
        let query = supabase
            .from('social_posts')
            .select(`
                *,
                social_likes (usuario_dni)
            `);

        // Si status es 'all' (para admin), no filtramos por status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('fecha_creacion', { ascending: false });

        if (error) throw error;

        // Formatear para el front (añadir contador de likes)
        const posts = data.map(post => ({
            ...post,
            likesCount: post.social_likes?.length || 0,
            likedByUser: false // Se calculará en el front según el DNI logueado
        }));

        return NextResponse.json({ status: 'success', data: posts });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, nombre, image, titulo, descripcion, taller_id } = body;

        if (!image || !dni) throw new Error("Imagen y DNI requeridos");

        console.log(`📸 Subiendo obra de arte de ${nombre} (DNI: ${dni}) a Cloudinary...`);

        // Subir a Cloudinary (esperamos que 'image' ya sea el Data URI completo)
        const uploadRes = await cloudinary.uploader.upload(image, {
            folder: `rooster/galeria_alumnos/${dni}`,
            public_id: `post_${Date.now()}`,
            resource_type: "image"
        });

        // Registrar en Supabase
        const { data: newPost, error: dbErr } = await supabase.from('social_posts').insert({
            alumno_dni: dni,
            alumno_nombre: nombre,
            imagen_url: uploadRes.secure_url,
            titulo: titulo || 'Sin título',
            descripcion: descripcion || '',
            taller_id: taller_id || null,
            status: 'active' // Por defecto activo
        }).select().single();

        if (dbErr) throw dbErr;

        return NextResponse.json({ status: 'success', data: newPost });

    } catch (error) {
        console.error("Social Post Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// NUEVO: PUT para cambiar estado (Papelera/Restaurar)
export async function PUT(request) {
    try {
        const { id, status, admin_dni } = await request.json();

        // Validación de seguridad simple (solo Admin 999 puede moderar)
        if (admin_dni !== '999') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 403 });
        }

        // Usamos supabaseAdmin para saltar RLS
        const { data, error } = await supabaseAdmin
            .from('social_posts')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// NUEVO: DELETE para eliminación permanente
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const admin_dni = searchParams.get('admin_dni');

        if (admin_dni !== '999') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 403 });
        }

        // Aquí podríamos borrar también de Cloudinary si tuviéramos el public_id, 
        // pero por ahora borramos de la DB.
        const { error } = await supabaseAdmin
            .from('social_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Eliminado permanentemente' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
