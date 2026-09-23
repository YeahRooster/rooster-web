import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { data } = await request.json(); // base64
        
        if (!data) {
            return NextResponse.json({ status: 'error', message: 'No file data' }, { status: 400 });
        }

        const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${data}`, {
            folder: 'comunidad'
        });

        return NextResponse.json({ status: 'success', url: uploadResult.secure_url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
