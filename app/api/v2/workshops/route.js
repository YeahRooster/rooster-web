import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET() {
    try {
        console.log("--- SUPABASE WORKSHOPS API v2 ---");

        const { data, error } = await supabase
            .from('talleres')
            .select('*')
            .eq('activo', true)
            .order('id', { ascending: true });

        console.log(`WORKSHOPS V2 DEBUG: Encontrados ${data?.length || 0} talleres activos`);
        if (error) {
            console.error("WORKSHOPS V2 ERROR:", error);
            throw error;
        }

        // Mapear al formato que espera el frontend
        const workshops = data.map(t => ({
            id: t.id,
            title: t.titulo,
            day: t.dia,
            time: t.horario,
            description: t.descripcion_corta,
            fullDescription: t.descripcion_larga,
            image: t.imagen_url,
            seats: t.cupos_totales,
            enrolled: t.cupos_ocupados
        }));

        return NextResponse.json(workshops, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-API-Version': '2.0-Supabase'
            }
        });

    } catch (error) {
        console.error("Error fetching workshops from Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
