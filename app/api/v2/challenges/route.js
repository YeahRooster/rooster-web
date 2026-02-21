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

        // 2. Si hay DNI, obtener informaciones del alumno para cada reto
        const processedChallenges = await Promise.all(challenges.map(async (challenge) => {
            // Obtener todas las submissions de este reto
            const { data: submissions, error: sErr } = await supabaseAdmin
                .from('challenge_submissions')
                .select('*')
                .eq('challenge_id', challenge.id);

            if (sErr) throw sErr;

            let mySubmission = null;
            let otherSubmissions = [];
            let myVotes = [];
            let isLocked = false;

            if (dni) {
                // Mi obra
                mySubmission = submissions.find(s => s.alumno_dni === dni) || null;
                // Obras de otros (para votar)
                otherSubmissions = submissions.filter(s => s.alumno_dni !== dni);

                // Mis votos en este reto
                const { data: votes } = await supabaseAdmin
                    .from('challenge_votes')
                    .select('submission_id')
                    .eq('challenge_id', challenge.id)
                    .eq('voter_dni', dni);

                myVotes = votes ? votes.map(v => v.submission_id) : [];

                // Mi estado de bloqueo
                const { data: lock } = await supabaseAdmin
                    .from('challenge_vote_locks')
                    .select('is_locked')
                    .eq('challenge_id', challenge.id)
                    .eq('voter_dni', dni)
                    .single();

                if (lock?.is_locked) isLocked = true;
            } else {
                otherSubmissions = submissions;
            }

            return {
                ...challenge,
                mySubmission,
                submissions: otherSubmissions,
                myVotes,
                isLocked
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
