import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const body = await request.json();
        let { taller } = body;

        // Normalizar taller si aplica
        if (taller && taller.trim().toUpperCase() === 'TALLER DE GUION') {
            taller = 'TALLER DE GUION DE HISTORIETAS';
        }

        const cleanFolder = (taller || 'general').trim().replace(/[\s/\\?%*:|"<>]/g, '_');
        const folder = `rooster/recursos/${cleanFolder}`;
        const timestamp = Math.round(new Date().getTime() / 1000);

        const paramsToSign = {
            folder,
            timestamp
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

        return NextResponse.json({
            status: 'success',
            signature,
            timestamp,
            folder,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        console.error("Cloudinary sign error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
