import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';
import { supabase } from '@/config/supabase';
import { sendEnrollmentEmails } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Mapeo de campos para Google Sheets (GAS espera nombres específicos)
        const gasData = {
            dni: String(body.dni).trim(),
            nombre: body.name,
            email: body.email,
            telefono: body.phone, // I: TELEFONO (Alumno)
            tutor_celular: body.parentPhone, // J: CELULAR TUTOR
            ciudad: body.city,
            localidad: body.locality,
            direccion: body.address,
            tutor: body.tutorName,
            taller: body.workshopTitle,
            horario: body.selectedSchedules,
            es_menor_str: body.isMinor ? 'si' : 'no', // C: ES MENOR?
            experiencia: body.experiencia || 'No especifica',
            conocio: body.conocio || 'No especifica'
        };

        // Guardar en Google Sheets (Sigue siendo el respaldo oficial)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(gasData)
        });
        const result = await response.json();

        // 2. Si se guardó bien en Sheets, lo espejamos en Supabase para que el Login v2 funcione al instante
        if (result.status === 'success') {
            try {
                // Espejamos datos extendidos en Alumnos
                await supabase.from('alumnos').upsert({
                    dni: String(body.dni).trim(),
                    nombre: body.name,
                    email: body.email,
                    password: String(body.dni).trim(), // Default password
                    direccion: body.address,
                    telefono: body.phone,
                    ciudad: body.city,
                    localidad: body.locality,
                    tutor_nombre: body.tutorName,
                    tutor_telefono: body.parentPhone,
                    es_menor: body.isMinor,
                    fecha_ingreso: new Date(),
                    activo: false // Requiere aprobación manual del admin
                });

                // Insert en Inscripciones
                const { data: tData } = await supabase
                    .from('talleres')
                    .select('id')
                    .ilike('titulo', `%${body.originalTaller || body.workshopTitle}%`)
                    .single();

                await supabase.from('inscripciones').insert({
                    alumno_dni: String(body.dni).trim(),
                    taller_nombre: body.workshopTitle,
                    taller_id: tData?.id || null,
                    fecha_inscripcion: new Date()
                });

                // 3. Enviar Emails (IMPORTANTE: Await para que Vercel no mate el proceso)
                try {
                    console.log(`📧 Intentando enviar mails de inscripción para ${body.name}...`);
                    await sendEnrollmentEmails({
                        ...body,
                        workshopTitle: body.workshopTitle,
                        selectedSchedules: body.selectedSchedules
                    });
                    console.log("✅ Emails de inscripción enviados con éxito");
                } catch (errMail) {
                    console.error("❌ Error enviando mails de inscripción:", errMail);
                }

                console.log("✅ Datos espejados en Supabase correctamente");
            } catch (errSup) {
                console.error("❌ Error espejando en Supabase:", errSup);
                // No bloqueamos la respuesta al usuario porque Sheets ya guardó bien
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ Error en /api/enroll:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
