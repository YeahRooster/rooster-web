import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

export async function GET() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAccounting`, { cache: 'no-store' });
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
