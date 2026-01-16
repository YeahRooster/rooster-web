import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function GET() {
    try {
        // Obtener posts con cuenta de likes (vía join lateral o conteo simple)
        const { data, error } = await supabase
            .from('social_posts')
            .select(`
                *,
                social_likes (usuario_dni)
            `)
            .order('fecha_creacion', { ascending: false });

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

        console.log(`📸 Subiendo obra de arte de ${nombre} a Cloudinary...`);

        // Subir a Cloudinary
        const uploadRes = await cloudinary.uploader.upload(`data:image/jpeg;base64,${image}`, {
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
            taller_id: taller_id || null
        }).select().single();

        if (dbErr) throw dbErr;

        return NextResponse.json({ status: 'success', data: newPost });

    } catch (error) {
        console.error("Social Post Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
