import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// POST: Votar / Quitar voto
export async function POST(request) {
    try {
        const body = await request.json();
        const { challenge_id, submission_id, voter_dni } = body;

        // 1. Verificar etapa de votación y ronda actual
        const { data: challenge } = await supabaseAdmin
            .from('challenges')
            .select('fecha_cierre_subida, fecha_cierre_votacion, round, tie_breaker_ids')
            .eq('id', challenge_id)
            .single();

        const ahora = new Date();
        if (ahora < new Date(challenge.fecha_cierre_subida)) {
            return NextResponse.json({ status: 'error', message: 'La votación aún no ha comenzado' }, { status: 403 });
        }
        if (ahora > new Date(challenge.fecha_cierre_votacion)) {
            return NextResponse.json({ status: 'error', message: 'La votación ha finalizado' }, { status: 403 });
        }

        const currentRound = challenge.round || 1;
        const isTieBreak = currentRound > 1;

        // 2. Si es desempate, verificar que la obra sea parte del desempate
        if (isTieBreak && !challenge.tie_breaker_ids?.includes(submission_id)) {
            return NextResponse.json({ status: 'error', message: 'Solo podés votar por las obras en desempate' }, { status: 403 });
        }

        // 3. Verificar si el usuario está bloqueado (regla del 3er voto o 1er voto en desempate)
        const { data: lock } = await supabaseAdmin
            .from('challenge_vote_locks')
            .select('is_locked')
            .eq('challenge_id', challenge_id)
            .eq('voter_dni', voter_dni)
            .eq('round', currentRound)
            .single();

        if (lock?.is_locked) {
            return NextResponse.json({ status: 'error', message: 'Tus votos son inamovibles' }, { status: 403 });
        }

        // 4. Verificar si ya votó esta obra (Toggle logic)
        const { data: existingVote } = await supabaseAdmin
            .from('challenge_votes')
            .select('*')
            .eq('submission_id', submission_id)
            .eq('voter_dni', voter_dni)
            .eq('round', currentRound)
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
            // Contar votos actuales en ESTA RONDA
            const { count: currentVotes } = await supabaseAdmin
                .from('challenge_votes')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', challenge_id)
                .eq('voter_dni', voter_dni)
                .eq('round', currentRound);

            // Límite: 3 en ronda 1, 1 en desempate
            const limit = isTieBreak ? 1 : 3;

            if (currentVotes >= limit) {
                return NextResponse.json({ status: 'error', message: `Ya utilizaste tu${limit > 1 ? 's' : ''} ${limit} voto${limit > 1 ? 's' : ''}` }, { status: 403 });
            }

            await supabaseAdmin
                .from('challenge_votes')
                .insert([{ challenge_id, submission_id, voter_dni, round: currentRound }]);

            // Si alcanzó el límite, BLOQUEAR
            if (currentVotes === limit - 1) {
                await supabaseAdmin
                    .from('challenge_vote_locks')
                    .upsert({ challenge_id, voter_dni, round: currentRound, is_locked: true });
            }

            return NextResponse.json({ status: 'success', action: 'added', isLocked: currentVotes === limit - 1 });
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
