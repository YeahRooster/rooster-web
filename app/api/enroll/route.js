import { NextResponse } from 'next/server';
import { GOOGLE_SCRIPT_URL } from '@/config/google_script';
import { supabase } from '@/config/supabase';

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Guardar en Google Sheets (Sigue siendo el respaldo oficial)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        const result = await response.json();

        // 2. Si se guardó bien en Sheets, lo espejamos en Supabase para que el Login v2 funcione al instante
        if (result.status === 'success') {
            try {
                // Upsert en Alumnos
                await supabase.from('alumnos').upsert({
                    dni: String(body.dni).trim(),
                    nombre: body.nombre,
                    email: body.email,
                    password: String(body.dni).trim(), // Default password
                    fecha_ingreso: new Date()
                });

                // Insert en Inscripciones
                const { data: tData } = await supabase
                    .from('talleres')
                    .select('id')
                    .ilike('titulo', `%${body.taller}%`)
                    .single();

                await supabase.from('inscripciones').insert({
                    alumno_dni: String(body.dni).trim(),
                    taller_nombre: body.taller,
                    taller_id: tData?.id || null,
                    fecha_inscripcion: new Date()
                });

                console.log("✅ Datos espejados en Supabase correctamente");
            } catch (errSup) {
                console.error("❌ Error espejando en Supabase:", errSup);
                // No bloqueamos la respuesta al usuario porque Sheets ya guardó bien
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
