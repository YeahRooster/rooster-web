import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function GET() {
    try {
        // Cache busting and clear origin
        const url = `${GOOGLE_SCRIPT_URL}?action=getWorkshops&v=${Date.now()}`;
        console.log("--- WORKSHOPS API DEBUG ---");
        console.log("Calling Script URL:", url);

        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);

        const result = await response.json();

        if (result.status === 'success') {
            return NextResponse.json(result.workshops || []);
        }

        // Si hay error, lo devolvemos para verlo en el front
        return NextResponse.json({
            error: result.message || 'Error en script',
            debug_url: url
        }, { status: 400 });

    } catch (error) {
        console.error("Error fetching workshops:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
