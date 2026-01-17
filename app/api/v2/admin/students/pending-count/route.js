import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET() {
    try {
        const { count, error } = await supabase
            .from('alumnos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', false);

        if (error) throw error;

        return NextResponse.json({ status: 'success', count: count || 0 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
