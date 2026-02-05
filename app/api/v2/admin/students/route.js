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
        const body = await request.json();
        const { dni, activo, notificaciones_activas } = body;
        const cleanDni = String(dni).trim();

        const updateData = {};
        if (activo !== undefined) updateData.activo = activo;
        if (notificaciones_activas !== undefined) updateData.notificaciones_activas = notificaciones_activas;

        const { error } = await supabaseAdmin
            .from('alumnos')
            .update(updateData)
            .eq('dni', cleanDni);

        if (error) throw error;

        // --- SINCRONIZACIÓN CON EXCEL (Solo si cambia el estado activo) ---
        if (activo !== undefined) {
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
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("❌ Error en PUT /api/v2/admin/students:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
