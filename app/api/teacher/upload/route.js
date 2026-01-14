import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function POST(request) {
    try {
        const body = await request.json();

        // El problema del 50% y el error JSON suele ser que Google redirecciona (302)
        // en los POST. Next.js fetch a veces no sigue bien esa redirección.
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            redirect: 'follow', // Forzamos seguir la redirección de Google
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const text = await response.text();
        console.log("--- UPLOAD DEBUG ---");
        console.log("Raw Response from Google:", text.substring(0, 100));

        try {
            const result = JSON.parse(text);
            return NextResponse.json(result);
        } catch (e) {
            // Si Google responde con HTML (error de permisos o login), lo capturamos
            return NextResponse.json({
                status: 'error',
                message: "Google devolvió una respuesta no válida. Verifica que el script esté publicado para 'Cualquiera' (Anyone)."
            });
        }

    } catch (error) {
        console.error("Upload Route Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
