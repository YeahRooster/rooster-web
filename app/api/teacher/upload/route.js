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
        const { filename, data, taller, teacher, filetype, teacher_dni } = body;

        console.log(`☁️ Subiendo archivo a Cloudinary para el taller: ${taller}`);

        // SOLUCIÓN FINAL PDF:
        // PDFs usan resource_type 'raw' (evita 401) y NECESITAN extensión en public_id
        // Imágenes usan 'auto' y NO necesitan extensión (Cloudinary la agrega)
        const isDocument = filename.toLowerCase().endsWith('.pdf') ||
            filename.toLowerCase().endsWith('.doc') ||
            filename.toLowerCase().endsWith('.docx');

        const resourceType = isDocument ? 'raw' : 'auto';
        const publicId = isDocument ? filename : filename.split('.')[0]; // CON extensión si es raw

        const mime = filetype || 'application/pdf';

        // Subir a Cloudinary (data es base64)
        const uploadRes = await cloudinary.uploader.upload(`data:${mime};base64,${data}`, {
            folder: `rooster/recursos/${taller.replace(/\s+/g, '_')}`,
            public_id: publicId,
            resource_type: resourceType,
            type: 'upload', // Tipo público (no authenticated ni private)
            access_mode: 'public', // Acceso público explícito para raw
            invalidate: true // Invalidar cache si resubimos
        });

        // Registrar en Supabase usando ADMIN para evitar RLS
        const { error: dbErr } = await supabaseAdmin.from('recursos').insert({
            taller: taller,
            nombre_archivo: filename,
            url_archivo: uploadRes.secure_url,
            profesor_dni: teacher_dni || null,
            fecha_subida: new Date()
        });

        if (dbErr) throw dbErr;

        return NextResponse.json({
            status: 'success',
            url: uploadRes.secure_url
        });

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
