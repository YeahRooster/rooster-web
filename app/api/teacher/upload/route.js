import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';
import { sendResourceNotificationEmail } from '@/lib/email';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, filename, data, taller, teacher, filetype, teacher_dni } = body;

        console.log(`☁️ Procesando recurso para el taller: ${taller} (Acción: ${action || 'upload'})`);

        let resourceUrl = '';

        if (action === 'shareNote') {
            // Caso 1: NOTA o LINK (No usa Cloudinary)
            const { error: dbErr } = await supabaseAdmin.from('recursos').insert({
                taller: taller,
                nombre_archivo: filename,
                url_archivo: data, // El link o mensaje se guarda en la URL
                profesor_dni: teacher_dni || null,
                fecha_subida: new Date()
            });

            if (dbErr) throw dbErr;
            resourceUrl = data;
        } else {
            // Caso 2: ARCHIVO (Usa Cloudinary)
            const isDocument = filename.toLowerCase().endsWith('.pdf') ||
                filename.toLowerCase().endsWith('.doc') ||
                filename.toLowerCase().endsWith('.docx');

            const resourceType = isDocument ? 'raw' : 'auto';
            const publicId = isDocument ? filename : filename.split('.')[0];
            const mime = filetype || 'application/pdf';

            // Subir a Cloudinary
            const uploadRes = await cloudinary.uploader.upload(`data:${mime};base64,${data}`, {
                folder: `rooster/recursos/${taller.replace(/\s+/g, '_')}`,
                public_id: publicId,
                resource_type: resourceType,
                type: 'upload',
                access_mode: 'public',
                invalidate: true
            });

            // Registrar en Supabase
            const { error: dbErr } = await supabaseAdmin.from('recursos').insert({
                taller: taller,
                nombre_archivo: filename,
                url_archivo: uploadRes.secure_url,
                profesor_dni: teacher_dni || null,
                fecha_subida: new Date()
            });

            if (dbErr) throw dbErr;
            resourceUrl = uploadRes.secure_url;
        }

        // --- LÓGICA DE NOTIFICACIONES ---
        // 1. Buscar alumnos inscriptos y activos en este taller
        const { data: activeStudents, error: iErr } = await supabaseAdmin
            .from('inscripciones')
            .select('alumno_dni, alumnos!inner(nombre, email)')
            .eq('taller_nombre', taller)
            .eq('alumnos.activo', true);

        if (!iErr && activeStudents?.length > 0) {
            // 2. Crear las notificaciones visuales (campanita)
            const notifications = activeStudents.map(i => ({
                destinatario_dni: i.alumno_dni,
                actor_nombre: teacher || 'Tu profesor',
                tipo: 'RECURSO',
                mensaje: `Tu profesor subió material nuevo al taller de ${taller}. ¡Ya está disponible para descargarlo!`,
                leida: false
            }));

            await supabaseAdmin.from('social_notifications').insert(notifications);

            // 3. (OPCIONAL) Enviar mails desactivado por pedido del usuario
            // para evitar saturar la bandeja de entrada.
            /*
            Promise.all(activeStudents.map(s => {
                if (s.alumnos.email) {
                    return sendResourceNotificationEmail({
                        to: s.alumnos.email,
                        studentName: s.alumnos.nombre,
                        teacherName: teacher || 'Tu profesor',
                        workshopName: taller,
                        resourceName: filename
                    });
                }
            })).catch(e => console.error("Error enviando mails de recurso:", e));
            */
        }

        return NextResponse.json({
            status: 'success',
            url: resourceUrl
        });

    } catch (error) {
        console.error("Teacher Upload Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
