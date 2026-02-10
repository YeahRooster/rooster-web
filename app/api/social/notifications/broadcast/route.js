import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { sendEmail, getEmailTemplate } from '@/lib/email';

export async function POST(request) {
    try {
        const { mensaje, tallerIds, targetAll, targetDni } = await request.json();

        if (!mensaje) {
            return NextResponse.json({ status: 'error', message: 'El mensaje es obligatorio' }, { status: 400 });
        }

        let targetedDnis = new Set();
        let targetEmails = []; // Para enviar mails

        if (targetDni) {
            targetedDnis.add(targetDni);
            // Obtener email del destinatario
            const { data: al } = await supabaseAdmin.from('alumnos').select('email').eq('dni', targetDni).single();
            if (al?.email) targetEmails.push({ email: al.email, dni: targetDni });
        } else if (targetAll) {
            // Obtener todos los alumnos activos
            const { data: alumnos, error: errAl } = await supabaseAdmin
                .from('alumnos')
                .select('dni, email')
                .eq('activo', true);

            if (errAl) throw errAl;
            alumnos.forEach(a => {
                targetedDnis.add(a.dni);
                if (a.email) targetEmails.push({ email: a.email, dni: a.dni });
            });
        } else if (tallerIds && tallerIds.length > 0) {
            // Obtener alumnos de talleres específicos e emails
            const { data: alumnos, error: errAl } = await supabaseAdmin
                .from('alumnos')
                .select('dni, email, inscripciones!inner(taller_id)')
                .eq('activo', true)
                .in('inscripciones.taller_id', tallerIds);

            if (errAl) throw errAl;
            alumnos.forEach(a => {
                targetedDnis.add(a.dni);
                if (a.email) targetEmails.push({ email: a.email, dni: a.dni });
            });
        } else {
            return NextResponse.json({ status: 'error', message: 'Debes seleccionar al menos un taller o marcar todos' }, { status: 400 });
        }

        if (targetedDnis.size === 0) {
            return NextResponse.json({ status: 'success', count: 0, message: 'No se encontraron alumnos para los criterios seleccionados' });
        }

        // 2. Crear las notificaciones en base de datos
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

        // 3. Enviar Emails (Asíncrono, no bloqueamos la respuesta)
        // Usamos la plantilla de Rooster
        const html = getEmailTemplate(`
            <h2 style="color: #333; margin-bottom: 20px;">Novedades de Rooster 📣</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">${mensaje}</p>
            <div style="text-align: center; margin-top: 35px;">
                <a href="https://rooster-web-orcin.vercel.app/mi-cuenta" style="background-color: #1a1a1a; color: #ffcc00; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Ir a Mi Cuenta</a>
            </div>
        `);

        // Enviamos los mails uno por uno (o en paralelo limitado)
        Promise.all(targetEmails.map(t =>
            sendEmail({ to: t.email, subject: 'Importante: Comunicación de Rooster Espacio', html })
        )).catch(e => console.error("Error enviando mails de broadcast:", e));

        return NextResponse.json({ status: 'success', count: insertedCount });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
