import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tallerFilter = searchParams.get('taller'); // Opcional, para profesores

        let query = supabase
            .from('inscripciones')
            .select(`
                alumno_dni,
                taller_nombre,
                horario,
                alumnos (nombre, email)
            `);

        // Si hay filtro de taller (Profesor)
        if (tallerFilter) {
            query = query.ilike('taller_nombre', `%${tallerFilter}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Procesar datos para el cronograma
        // Formato esperado: Array de objetos { student, day, time, workshop }
        // La columna 'horario' viene del Excel como texto libre (ej: "Lunes 18hs", "Martes Siesta")
        // Necesitaremos un parser básico en el frontend si el texto es muy sucio, 
        // pero aquí devolvemos la data cruda limpia.

        const schedule = data.map(i => ({
            student: i.alumnos?.nombre || 'Desconocido',
            dni: i.alumno_dni,
            workshop: i.taller_nombre,
            raw_schedule: i.horario || 'Sin Horario',
            // Intentar extraer día si es posible (Lunes, Martes...)
            day: detectDay(i.horario),
            time_block: detectTimeBlock(i.horario)
        }));

        return NextResponse.json({ status: 'success', data: schedule });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Helpers simples para clasificar (Mejorable según data real)
function detectDay(text) {
    if (!text) return 'Sin Definir';
    const lower = text.toLowerCase();
    if (lower.includes('lunes')) return 'Lunes';
    if (lower.includes('martes')) return 'Martes';
    if (lower.includes('miér') || lower.includes('mier')) return 'Miércoles';
    if (lower.includes('jueves')) return 'Jueves';
    if (lower.includes('viernes')) return 'Viernes';
    if (lower.includes('sábado') || lower.includes('sab')) return 'Sábado';
    return 'Otros';
}

function detectTimeBlock(text) {
    if (!text) return 'Sin Horario';
    const lower = text.toLowerCase();
    // Lógica básica basada en palabras clave comunes
    if (lower.includes('mañana') || lower.includes('10') || lower.includes('11') || lower.includes('09') || lower.includes('9')) return 'Mañana';
    if (lower.includes('siesta') || lower.includes('14') || lower.includes('15') || lower.includes('13')) return 'Siesta';
    if (lower.includes('tarde') || lower.includes('18') || lower.includes('19') || lower.includes('17') || lower.includes('16') || lower.includes('20')) return 'Tarde';
    return 'Tarde'; // Default fallback
}
