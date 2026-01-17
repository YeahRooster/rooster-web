import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';

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
        const cleanDni = String(dni).trim();

        const { error } = await supabaseAdmin
            .from('alumnos')
            .update({ activo })
            .eq('dni', cleanDni);

        if (error) throw error;

        // --- SINCRONIZACIÓN CON EXCEL ---
        try {
            const syncRes = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStatus',
                    dni: cleanDni,
                    status: activo ? 'ACTIVO' : 'INACTIVO'
                })
            });
            const syncData = await syncRes.json();
            console.log("✅ Sync Excel Result:", syncData);
        } catch (errExcel) {
            console.error("❌ Error sincronizando con Excel:", errExcel);
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
