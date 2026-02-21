import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// POST: Votar / Quitar voto
export async function POST(request) {
    try {
        const body = await request.json();
        const { challenge_id, submission_id, voter_dni } = body;

        // 1. Verificar etapa de votación
        const { data: challenge } = await supabaseAdmin
            .from('challenges')
            .select('fecha_cierre_subida, fecha_cierre_votacion')
            .eq('id', challenge_id)
            .single();

        const ahora = new Date();
        if (ahora < new Date(challenge.fecha_cierre_subida)) {
            return NextResponse.json({ status: 'error', message: 'La votación aún no ha comenzado' }, { status: 403 });
        }
        if (ahora > new Date(challenge.fecha_cierre_votacion)) {
            return NextResponse.json({ status: 'error', message: 'La votación ha finalizado' }, { status: 403 });
        }

        // 2. Verificar si el usuario está bloqueado (regla del 3er voto)
        const { data: lock } = await supabaseAdmin
            .from('challenge_vote_locks')
            .select('is_locked')
            .eq('challenge_id', challenge_id)
            .eq('voter_dni', voter_dni)
            .single();

        if (lock?.is_locked) {
            return NextResponse.json({ status: 'error', message: 'Tus votos son inamovibles' }, { status: 403 });
        }

        // 3. Verificar si ya votó esta obra (Toggle logic)
        const { data: existingVote } = await supabaseAdmin
            .from('challenge_votes')
            .select('*')
            .eq('submission_id', submission_id)
            .eq('voter_dni', voter_dni)
            .single();

        if (existingVote) {
            // QUITAR VOTO
            await supabaseAdmin
                .from('challenge_votes')
                .delete()
                .eq('id', existingVote.id);

            return NextResponse.json({ status: 'success', action: 'removed' });
        } else {
            // AGREGAR VOTO
            // Contar votos actuales
            const { count: currentVotes } = await supabaseAdmin
                .from('challenge_votes')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', challenge_id)
                .eq('voter_dni', voter_dni);

            if (currentVotes >= 3) {
                return NextResponse.json({ status: 'error', message: 'Ya utilizaste tus 3 votos' }, { status: 403 });
            }

            await supabaseAdmin
                .from('challenge_votes')
                .insert([{ challenge_id, submission_id, voter_dni }]);

            // Si es el 3er voto, BLOQUEAR
            if (currentVotes === 2) {
                await supabaseAdmin
                    .from('challenge_vote_locks')
                    .upsert({ challenge_id, voter_dni, is_locked: true });
            }

            return NextResponse.json({ status: 'success', action: 'added', isLocked: currentVotes === 2 });
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
