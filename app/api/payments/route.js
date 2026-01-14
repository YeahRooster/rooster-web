import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const pass = searchParams.get('pass');

    if (!dni || !pass) {
        return NextResponse.json({ error: 'DNI y Contraseña requeridos' }, { status: 400 });
    }

    try {
        const url = `${GOOGLE_SCRIPT_URL}?dni=${encodeURIComponent(dni.trim())}&pass=${encodeURIComponent(pass.trim())}`;
        const response = await fetch(url, { cache: 'no-store' });
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
