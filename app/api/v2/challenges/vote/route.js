import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// POST: Votar / Quitar voto
export async function POST(request) {
    try {
        const body = await request.json();
        const { challenge_id, submission_id, voter_dni } = body;

        // 1. Verificar etapa de votación y ronda actual
        const { data: challenge, error: challengeErr } = await supabaseAdmin
            .from('challenges')
            .select('id, fecha_cierre_subida, fecha_cierre_votacion, round, tie_breaker_ids')
            .eq('id', challenge_id)
            .single();

        if (challengeErr || !challenge) {
            console.error("VOTE API ERROR: Challenge no encontrado o error de DB. challenge_id recibido:", challenge_id, "Error interno:", challengeErr);
            return NextResponse.json({ status: 'error', message: 'No se pudo verificar el desafío. Actualizá la página e intentá de nuevo.' }, { status: 404 });
        }

        // 1.5 Verificar si el alumno tiene acceso restringido
        const { data: studentCheck } = await supabaseAdmin
            .from('alumnos')
            .select('acceso_restringido')
            .eq('dni', voter_dni)
            .single();

        if (studentCheck?.acceso_restringido) {
            return NextResponse.json({ status: 'error', message: 'Tu cuenta tiene el acceso restringido. Por favor, comunícate con administración para regularizar tu situación.' }, { status: 403 });
        }

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

        // 3. Removemos la lógica antigua de bloqueo (lock) para permitir editar los votos
        // ya que ahora hay múltiples categorías y es más fácil dejar que administren sus 3 votos libremente.

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
            // Obtener la categoría de la obra que se está votando
            const { data: submissionTarget } = await supabaseAdmin
                .from('challenge_submissions')
                .select('categoria')
                .eq('id', submission_id)
                .single();
            const targetCategory = submissionTarget?.categoria || 'adultos';

            // Obtener todos los votos actuales en esta ronda
            const { data: currentVotesData } = await supabaseAdmin
                .from('challenge_votes')
                .select('submission_id')
                .eq('challenge_id', challenge_id)
                .eq('voter_dni', voter_dni)
                .eq('round', currentRound);

            let currentCategoryVotesCount = 0;
            if (currentVotesData && currentVotesData.length > 0) {
                const votedIds = currentVotesData.map(v => v.submission_id);
                const { data: votedSubs } = await supabaseAdmin
                    .from('challenge_submissions')
                    .select('categoria')
                    .in('id', votedIds);
                
                if (votedSubs) {
                    currentCategoryVotesCount = votedSubs.filter(s => (s.categoria || 'adultos') === targetCategory).length;
                }
            }

            // Límite: 3 en ronda 1, 1 en desempate (POR CATEGORÍA)
            const limit = isTieBreak ? 1 : 3;

            if (currentCategoryVotesCount >= limit) {
                return NextResponse.json({ status: 'error', message: `Ya utilizaste tu${limit > 1 ? 's' : ''} ${limit} voto${limit > 1 ? 's' : ''} en la categoría ${targetCategory}` }, { status: 403 });
            }

            await supabaseAdmin
                .from('challenge_votes')
                .insert([{ challenge_id, submission_id, voter_dni, round: currentRound }]);

            return NextResponse.json({ status: 'success', action: 'added', isLocked: false });
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
