import { NextResponse } from 'next/server';

// Este endpoint fue desactivado. La plataforma ya no depende de Google Sheets.
// Todos los datos se gestionan directamente en Supabase.
export async function POST() {
    return NextResponse.json({
        status: 'error',
        message: 'La sincronización con Google Sheets ha sido desactivada. La plataforma opera de forma independiente en Supabase.'
    }, { status: 410 });
}
