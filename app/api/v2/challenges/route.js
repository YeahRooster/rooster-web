import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET: Obtener reto actual y submissions (público/alumno)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Aceptamos tanto dni como alumno_dni para mayor compatibilidad
        const dni = searchParams.get('dni') || searchParams.get('alumno_dni');

        // 1. Obtener todos los desafíos recientes (ordenados por fecha de creación)
        const { data: challenges, error: cErr } = await supabaseAdmin
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (cErr) throw cErr;
        if (!challenges || challenges.length === 0) {
            return NextResponse.json({ status: 'success', data: [] });
        }

        // 2. Si hay DNI, procesar retos
        const processedChallenges = await Promise.all(challenges.map(async (c) => {
            const ahora = new Date();
            const finVotacion = new Date(c.fecha_cierre_votacion);
            let challenge = { ...c };

            // --- LÓGICA DE CIERRE AUTOMÁTICO Y DESEMPATE ---
            if (ahora >= finVotacion && !challenge.ganador_dni) {
                // Obtener todas las submissions
                const { data: subs } = await supabaseAdmin
                    .from('challenge_submissions')
                    .select('id, alumno_dni, alumno_nombre')
                    .eq('challenge_id', challenge.id);

                if (subs && subs.length > 0) {
                    // Si estamos en una ronda de desempate, solo contamos los de tie_breaker_ids
                    const targetSubs = (challenge.tie_breaker_ids && challenge.tie_breaker_ids.length > 0)
                        ? subs.filter(s => challenge.tie_breaker_ids.includes(s.id))
                        : subs;

                    // Contar votos de la ronda actual
                    // IMPORTANTE: Para la ronda 1, incluimos votos donde round sea 1 o NULL para retrocompatibilidad
                    let voteQuery = supabaseAdmin
                        .from('challenge_votes')
                        .select('submission_id')
                        .eq('challenge_id', challenge.id);

                    if ((challenge.round || 1) === 1) {
                        voteQuery = voteQuery.or('round.eq.1,round.is.null');
                    } else {
                        voteQuery = voteQuery.eq('round', challenge.round);
                    }

                    const { data: votes } = await voteQuery;

                    const counts = {};
                    targetSubs.forEach(s => counts[s.id] = 0);
                    votes?.forEach(v => { if (counts[v.submission_id] !== undefined) counts[v.submission_id]++; });

                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    const maxVotes = sorted[0][1];
                    const winners = sorted.filter(s => s[1] === maxVotes);

                    if (winners.length === 1 || maxVotes === 0) {
                        // GANADOR ÚNICO (o nadie votó, se queda el primero/random)
                        const winnerSub = subs.find(s => s.id === winners[0][0]);
                        const { data: updated } = await supabaseAdmin
                            .from('challenges')
                            .update({
                                ganador_dni: winnerSub?.alumno_dni || 'Nadie',
                                ganador_nombre: winnerSub?.alumno_nombre || 'Sin votos'
                            })
                            .eq('id', challenge.id)
                            .select()
                            .single();
                        challenge = { ...updated };
                    } else {
                        // EMPATE: Nueva Ronda
                        const newTieBreakerIds = winners.map(w => w[0]);
                        const newDeadline = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // +24hs
                        const { data: updated } = await supabaseAdmin
                            .from('challenges')
                            .update({
                                round: (challenge.round || 1) + 1,
                                tie_breaker_ids: newTieBreakerIds,
                                fecha_cierre_votacion: newDeadline.toISOString()
                            })
                            .eq('id', challenge.id)
                            .select()
                            .single();
                        challenge = { ...updated };
                    }
                }
            }

            // Obtener todas las submissions actualizadas para este reto
            const { data: submissions, error: sErr } = await supabaseAdmin
                .from('challenge_submissions')
                .select('*')
                .eq('challenge_id', challenge.id);

            if (sErr) throw sErr;

            let mySubmission = null;
            let otherSubmissions = [];
            let myVotes = [];
            let isLocked = false;

            // Si el reto terminó, queremos ver los votos de todos
            const isFinished = ahora >= new Date(challenge.fecha_cierre_votacion);

            const subsWithVotes = await Promise.all(submissions.map(async (s) => {
                const { count } = await supabaseAdmin
                    .from('challenge_votes')
                    .select('*', { count: 'exact', head: true })
                    .eq('submission_id', s.id);
                return { ...s, total_votos: count };
            }));

            if (dni) {
                mySubmission = subsWithVotes.find(s => s.alumno_dni === dni) || null;
                // Filtrar según ronda de desempate
                otherSubmissions = subsWithVotes.filter(s => {
                    const isNotMe = s.alumno_dni !== dni;
                    const isInTieBreaker = (challenge.tie_breaker_ids && challenge.tie_breaker_ids.length > 0)
                        ? challenge.tie_breaker_ids.includes(s.id)
                        : true;
                    // Si el reto finalizó, mostramos la propia obra para poder ver sus votos
                    return (isFinished ? true : isNotMe) && isInTieBreaker;
                });

                // Mis votos en este reto (MISMA RONDA)
                const { data: votes } = await supabaseAdmin
                    .from('challenge_votes')
                    .select('submission_id')
                    .eq('challenge_id', challenge.id)
                    .eq('voter_dni', dni)
                    .eq('round', challenge.round || 1);

                myVotes = votes ? votes.map(v => v.submission_id) : [];

                // Mi estado de bloqueo (MISMA RONDA)
                const { data: lock } = await supabaseAdmin
                    .from('challenge_vote_locks')
                    .select('is_locked')
                    .eq('challenge_id', challenge.id)
                    .eq('voter_dni', dni)
                    .eq('round', challenge.round || 1)
                    .single();

                if (lock?.is_locked) isLocked = true;
            } else {
                otherSubmissions = subsWithVotes;
            }

            return {
                ...challenge,
                mySubmission,
                submissions: otherSubmissions,
                myVotes,
                isLocked,
                isFinished // Flag útil para el front
            };
        }));

        return NextResponse.json({
            status: 'success',
            data: processedChallenges
        });
    } catch (error) {
        console.error("Error in Challenges API:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Participar en un desafío (Subir obra)
export async function POST(request) {
    try {
        const body = await request.json();
        // Mapeamos los campos que vienen del frontend
        const {
            challenge_id,
            student_dni,
            student_name,
            image_base64, // Ahora recibimos base64
            bio,
            // Fallback por si enviamos los originales
            alumno_dni,
            alumno_nombre,
            imagen_url
        } = body;

        const final_dni = student_dni || alumno_dni;
        const final_nombre = student_name || alumno_nombre;
        const final_bio = bio || "";

        if (!final_dni || !challenge_id) {
            return NextResponse.json({ status: 'error', message: 'Falta DNI o ID del reto' }, { status: 400 });
        }

        // 1. Verificar si el reto está en etapa de subida
        const { data: challenge, error: cErr } = await supabaseAdmin
            .from('challenges')
            .select('fecha_cierre_subida')
            .eq('id', challenge_id)
            .single();

        if (cErr || !challenge) {
            return NextResponse.json({ status: 'error', message: 'Desafío no encontrado' }, { status: 404 });
        }

        if (new Date() > new Date(challenge.fecha_cierre_subida)) {
            return NextResponse.json({ status: 'error', message: 'La etapa de subida ha finalizado' }, { status: 403 });
        }

        // 2. Manejar la imagen (Subida a Cloudinary)
        let final_url = imagen_url;

        if (image_base64 && !final_url) {
            try {
                // Cloudinary espera el prefijo data:image/... si no lo tiene, se lo agregamos (asumimos base64 puro)
                const imageData = image_base64.startsWith('data:') ? image_base64 : `data:image/jpeg;base64,${image_base64}`;

                const uploadRes = await cloudinary.uploader.upload(imageData, {
                    folder: `rooster/desafios/${challenge_id}`,
                    public_id: `submission_${final_dni}`,
                    resource_type: "image",
                    overwrite: true
                });

                final_url = uploadRes.secure_url;
            } catch (storageErr) {
                console.error("Cloudinary Upload Error:", storageErr);
                // Fallback: Si Cloudinary falla, usamos placeholder para no trancar la UX
                final_url = "https://placehold.co/600x400?text=Obra+Enviada";
            }
        }

        // 3. Insertar o actualizar la obra
        const { data, error } = await supabaseAdmin
            .from('challenge_submissions')
            .upsert([{
                challenge_id,
                alumno_dni: final_dni,
                alumno_nombre: final_nombre,
                imagen_url: final_url,
                bio: final_bio
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        console.error("Error in Challenges POST:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
