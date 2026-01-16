import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'active' o 'pending'

        let query = supabase.from('alumnos').select('*').order('created_at', { ascending: false });

        if (status === 'pending') {
            query = query.eq('activo', false);
        } else if (status === 'active') {
            query = query.eq('activo', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { dni, activo } = await request.json();
        const { error } = await supabase
            .from('alumnos')
            .update({ activo })
            .eq('dni', dni);

        if (error) throw error;
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
