import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';
import { supabaseAdmin } from '@/config/supabaseAdmin'; // Admin client bypasses RLS
import { sendEnrollmentEmails } from '@/lib/email';

export const maxDuration = 30; // Aumentamos el tiempo de espera para que los mails salgan

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, workshopTitle, selectedSchedules } = body;

        console.log(`📝 Iniciando proceso para: ${name} (${workshopTitle})`);

        // 1. Mapeo de campos para Google Sheets
        const gasData = {
            dni: String(body.dni).trim(),
            nombre: body.name,
            email: body.email,
            telefono: body.phone,
            tutor_celular: body.parentPhone,
            ciudad: body.city,
            localidad: body.locality,
            direccion: body.address,
            tutor: body.tutorName,
            taller: body.workshopTitle,
            horario: body.selectedSchedules,
            es_menor_str: body.isMinor ? 'si' : 'no',
            experiencia: body.experiencia || 'No especifica',
            conocio: body.conocio || 'No especifica'
        };

        // Guardar en Google Sheets
        console.log("📡 Guardando en Sheets...");
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(gasData)
        });
        const result = await response.json();
        console.log("📊 Resultado Sheets:", result.status);

        // 2. Si Sheets OK, espejamos y enviamos mails
        if (result.status === 'success') {

            // --- INSCRIPCIÓN EN SUPABASE ---
            try {
                console.log("🗄️ Guardando en base de datos Supabase...");
                const { error: upsertErr } = await supabaseAdmin.from('alumnos').upsert({
                    dni: String(body.dni).trim(),
                    nombre: body.name,
                    email: body.email,
                    password: String(body.dni).trim(),
                    direccion: body.address,
                    telefono: body.phone,
                    ciudad: body.city,
                    localidad: body.locality,
                    tutor_nombre: body.tutorName,
                    tutor_telefono: body.parentPhone,
                    es_menor: body.isMinor,
                    fecha_ingreso: new Date(),
                    activo: false,
                    dado_de_baja: false
                });
                if (upsertErr) throw new Error('Error upsert alumno: ' + upsertErr.message);

                const { data: tData } = await supabaseAdmin
                    .from('talleres')
                    .select('id')
                    .ilike('titulo', `%${body.originalTaller || body.workshopTitle}%`)
                    .single();

                await supabaseAdmin.from('inscripciones').insert({
                    alumno_dni: String(body.dni).trim(),
                    taller_nombre: body.workshopTitle,
                    taller_id: tData?.id || null,
                    fecha_inscripcion: new Date()
                });
                console.log("✅ Datos guardados en Supabase");
            } catch (errSup) {
                console.error("❌ Error Supabase (continuamos):", errSup.message);
            }

            // --- ENVIO DE EMAILS ---
            try {
                console.log(`📧 Intentando enviar mails de inscripción a Alumno (${email}) y Admin...`);
                // IMPORTANTE: Se pasan todos los campos incluyendo experiencia y conocio
                await sendEnrollmentEmails(body);
                console.log("✅ Mails enviados exitosamente");
            } catch (errMail) {
                console.error("❌ ERROR CRÍTICO ENVIANDO MAILS:", errMail);
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ Error general en proceso de inscripción:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
