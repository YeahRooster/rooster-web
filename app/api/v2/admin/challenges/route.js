import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// Función helper para notificar alumnos
async function broadcastChallengeNotification(titulo, mensaje, talleresParticipantes) {
    try {
        if (!talleresParticipantes || talleresParticipantes.length === 0) return;

        let dnis = [];

        if (talleresParticipantes.includes('Todos')) {
            // Caso 1: Todos los alumnos activos
            const { data: alumnos, error } = await supabaseAdmin
                .from('alumnos')
                .select('dni')
                .eq('activo', true);

            if (error) throw error;
            if (alumnos) dnis = alumnos.map(a => a.dni);
        } else {
            // Caso 2: Alumnos de talleres específicos
            // 1. Obtener IDs de los talleres por su título
            const { data: talleresDB, error: tErr } = await supabaseAdmin
                .from('talleres')
                .select('id, titulo');

            if (tErr) throw tErr;

            // Filtramos los IDs que coinciden con los nombres base (ej: "Dibujo")
            const targetIds = talleresDB
                .filter(t => talleresParticipantes.some(tp => t.titulo.toLowerCase().includes(tp.toLowerCase())))
                .map(t => t.id);

            if (targetIds.length === 0) return;

            // 2. Obtener DNIs de inscripciones
            const { data: inscripciones, error: iErr } = await supabaseAdmin
                .from('inscripciones')
                .select('alumno_dni')
                .in('taller_id', targetIds);

            if (iErr) throw iErr;
            if (inscripciones) {
                // Eliminar duplicados
                dnis = [...new Set(inscripciones.map(i => i.alumno_dni))];
            }
        }

        if (dnis.length === 0) return;

        // 3. Insertar notificaciones
        // NOTA: La tabla social_notifications no tiene columna 'titulo'. 
        // Combinamos todo en 'mensaje'.
        const notifications = dnis.map(dni => ({
            destinatario_dni: dni,
            mensaje: `${titulo}: ${mensaje}`,
            tipo: 'DESAFIO',
            leida: false,
            fecha: new Date().toISOString()
        }));

        const { error: notifyErr } = await supabaseAdmin
            .from('social_notifications')
            .insert(notifications);

        if (notifyErr) throw notifyErr;
        return true;
    } catch (err) {
        console.error("Error in broadcast:", err);
        return false;
    }
}

// GET: Listar retos o submisiones de un reto específico (Admin)
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challenge_id');

    try {
        if (challengeId) {
            // Obtener todas las obras subidas para este reto con conteo de votos
            const { data, error } = await supabaseAdmin
                .from('challenge_submissions')
                .select(`
                    *,
                    votos:challenge_votes(count)
                `)
                .eq('challenge_id', challengeId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Aplanar el resultado del conteo
            const processedData = data.map(s => ({
                ...s,
                votos: s.votos?.[0]?.count || 0
            }));

            return NextResponse.json({ status: 'success', data: processedData });
        }

        // Listar todos los retos
        const { data, error } = await supabaseAdmin
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Crear nuevo reto
export async function POST(request) {
    try {
        const body = await request.json();
        const { titulo, descripcion, talleres_participantes, fecha_inicio, fecha_cierre_subida, fecha_cierre_votacion } = body;

        // Validaciones básicas
        if (!titulo || !fecha_inicio || !fecha_cierre_subida || !fecha_cierre_votacion) {
            return NextResponse.json({ status: 'error', message: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('challenges')
            .insert([{
                titulo,
                descripcion,
                talleres_participantes,
                fecha_inicio,
                fecha_cierre_subida,
                fecha_cierre_votacion
            }])
            .select()
            .single();

        if (error) throw error;

        // NOTIFICACIÓN: Nuevo Desafío
        await broadcastChallengeNotification(
            "🏆 Nuevo Desafío Artístico",
            `Se ha publicado el reto: "${titulo}". ¡Entrá a participar!`,
            talleres_participantes
        );

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// PUT: Editar reto (ej. cambiar ganador o fechas)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('challenges')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // NOTIFICACIÓN: Ganador o Cambio de etapa
        if (updates.ganador_dni) {
            await broadcastChallengeNotification(
                "👑 ¡Tenemos un Ganador!",
                `El desafío "${data.titulo}" ha finalizado. ¡Entrá a ver quién ganó!`,
                data.talleres_participantes
            );
        } else if (updates.stage_manual === 'VOTACION' || (updates.fecha_cierre_subida && new Date(updates.fecha_cierre_subida) < new Date())) {
            // Si el admin cambia algo que inicie la votación
            await broadcastChallengeNotification(
                "🗳️ ¡A Votar!",
                `Ya podés votar las obras del desafío: "${data.titulo}".`,
                data.talleres_participantes
            );
        }

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar reto o una obra específica
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id'); // ID del desafío
        const submissionId = searchParams.get('submission_id'); // ID de la obra específica

        // Caso 1: Eliminar una obra específica (submission)
        if (submissionId) {
            const { error: subErr } = await supabaseAdmin
                .from('challenge_submissions')
                .delete()
                .eq('id', submissionId);

            if (subErr) throw subErr;
            return NextResponse.json({ status: 'success', message: 'Obra eliminada correctamente' });
        }

        // Caso 2: Eliminar un desafío completo
        if (!id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('challenges')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Reto eliminado' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
