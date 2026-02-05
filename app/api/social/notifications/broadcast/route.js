import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { mensaje, tallerIds, targetAll } = await request.json();

        if (!mensaje) {
            return NextResponse.json({ status: 'error', message: 'El mensaje es obligatorio' }, { status: 400 });
        }

        let targetedDnis = new Set();

        if (targetAll) {
            // Obtener todos los alumnos activos
            const { data: alumnos, error: errAl } = await supabaseAdmin
                .from('alumnos')
                .select('dni')
                .eq('activo', true);

            if (errAl) throw errAl;
            alumnos.forEach(a => targetedDnis.add(a.dni));
        } else if (tallerIds && tallerIds.length > 0) {
            // Obtener alumnos de talleres específicos
            const { data: inscripciones, error: errInsc } = await supabaseAdmin
                .from('inscripciones')
                .select('alumno_dni')
                .in('taller_id', tallerIds);

            if (errInsc) throw errInsc;
            inscripciones.forEach(ins => targetedDnis.add(ins.alumno_dni));
        } else {
            return NextResponse.json({ status: 'error', message: 'Debes seleccionar al menos un taller o marcar todos' }, { status: 400 });
        }

        if (targetedDnis.size === 0) {
            return NextResponse.json({ status: 'success', count: 0, message: 'No se encontraron alumnos para los criterios seleccionados' });
        }

        // 2. Crear las notificaciones
        const notifications = Array.from(targetedDnis).map(dni => ({
            destinatario_dni: dni,
            actor_nombre: 'Rooster',
            tipo: 'BROADCAST',
            mensaje: mensaje,
            leida: false
        }));

        // Insertar en bloques (por límites de Supabase)
        const chunkSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < notifications.length; i += chunkSize) {
            const chunk = notifications.slice(i, i + chunkSize);
            const { error } = await supabaseAdmin.from('social_notifications').insert(chunk);
            if (error) console.error("Error inserting notification chunk:", error);
            else insertedCount += chunk.length;
        }

        return NextResponse.json({ status: 'success', count: insertedCount });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
