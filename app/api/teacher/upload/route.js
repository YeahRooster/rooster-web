import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { filename, data, taller, teacher } = body;

        console.log(`☁️ Subiendo archivo a Cloudinary para el taller: ${taller}`);

        // Subir a Cloudinary (data es base64)
        const uploadRes = await cloudinary.uploader.upload(`data:application/pdf;base64,${data}`, {
            folder: `rooster/recursos/${taller.replace(/\s+/g, '_')}`,
            public_id: filename.split('.')[0],
            resource_type: "auto"
        });

        // Registrar en Supabase
        const { error: dbErr } = await supabase.from('recursos').insert({
            taller: taller,
            nombre_archivo: filename,
            url_archivo: uploadRes.secure_url,
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
