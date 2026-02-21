import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET /api/v2/gallery/feature
// Obtiene todas las obras destacadas
export async function GET(request) {
    try {
        const { data, error } = await supabase
            .from('social_posts')
            .select(`
                *,
                social_likes (usuario_dni)
            `)
            .eq('featured', true)
            .order('fecha_creacion', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST /api/v2/gallery/feature
// Marca o desmarca una obra como destacada
export async function POST(request) {
    try {
        const { post_id, featured } = await request.json();

        if (!post_id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        // Usamos supabaseAdmin para bypass de RLS
        const { error } = await supabaseAdmin
            .from('social_posts')
            .update({ featured: featured })
            .eq('id', post_id);

        if (error) throw error;

        const action = featured ? 'destacada' : 'removida de destacados';
        return NextResponse.json({ status: 'success', message: `Obra ${action}` });

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
