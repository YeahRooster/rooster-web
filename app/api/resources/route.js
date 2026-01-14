import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const taller = searchParams.get('taller');

    if (!taller) {
        return NextResponse.json({ status: 'error', message: 'Taller no especificado' }, { status: 400 });
    }

    try {
        const url = `${GOOGLE_SCRIPT_URL}?action=getTeacherData&taller=${encodeURIComponent(taller)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();

        // Reutilizamos getTeacherData que ya devuelve los resources de ese taller
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching resources:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
