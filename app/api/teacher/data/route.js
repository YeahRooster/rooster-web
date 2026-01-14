import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const taller = searchParams.get('taller');

    if (!taller) return NextResponse.json({ status: 'error', message: 'Taller requerido' }, { status: 400 });

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTeacherData&taller=${encodeURIComponent(taller)}`, {
            cache: 'no-store'
        });
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
