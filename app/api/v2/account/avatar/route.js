import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, avatar_id, image } = body;

        if (!dni || !avatar_id) {
            return NextResponse.json({ status: 'error', message: 'DNI y Avatar ID requeridos' }, { status: 400 });
        }

        let avatarUrl = null;

        // Si es custom y viene imagen, subir a Cloudinary
        if (avatar_id === 'custom' && image) {
            console.log(`📸 Subiendo avatar custom de ${dni}...`);
            const uploadRes = await cloudinary.uploader.upload(image, {
                folder: `rooster/avatars/${dni}`,
                public_id: `avatar_${Date.now()}`,
                resource_type: "image",
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" }, // Auto-crop a la cara
                    { quality: "auto" }
                ]
            });
            avatarUrl = uploadRes.secure_url;
        }

        // Actualizar Supabase
        // Usamos supabaseAdmin para escribir en 'alumnos' sin restricciones excesivas de RLS (asumiendo que el endpoint valida sesión o contexto)
        // En un caso real, validaríamos el token de sesión aquí.
        const updateData = {
            avatar_id: avatar_id
        };
        if (avatarUrl) updateData.avatar_url = avatarUrl;
        // Si cambia a predefinido, podríamos querer limpiar avatar_url o dejarlo por si vuelve a custom.
        // Lo dejamos para que no pierda su foto anterior si cambia y vuelve.

        const { data, error } = await supabaseAdmin
            .from('alumnos')
            .update(updateData)
            .eq('dni', dni)
            .select('dni, nombre, email, avatar_id, avatar_url')
            .single();

        if (error) throw error;

        return NextResponse.json({
            status: 'success',
            message: 'Avatar actualizado',
            data: {
                avatar_id: data.avatar_id,
                avatar_url: data.avatar_url
            }
        });

    } catch (error) {
        console.error("Avatar Update Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
