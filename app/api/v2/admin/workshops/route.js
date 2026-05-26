import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET() {
    try {
        const { data: talleres, error } = await supabaseAdmin
            .from('talleres')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ status: 'success', data: talleres });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { data, error } = await supabaseAdmin
            .from('talleres')
            .insert([body])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;
        
        if (!id) return NextResponse.json({ status: 'error', message: 'Falta ID' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('talleres')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ status: 'error', message: 'Falta ID' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('talleres')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
