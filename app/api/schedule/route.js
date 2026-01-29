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

        const schedule = data.flatMap(i => {
            const rawHorario = i.horario || 'Sin Horario';
            const entries = parseScheduleEntries(rawHorario);

            return entries.map(entry => ({
                student: i.alumnos?.nombre || 'Desconocido',
                dni: i.alumno_dni,
                workshop: i.taller_nombre,
                raw_schedule: rawHorario,
                day: entry.day,
                time_block: entry.time_block
            }));
        });

        return NextResponse.json({ status: 'success', data: schedule });
    } catch (error) {
        console.error("Schedule API Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Procesa una cadena de horario que puede contener múltiples días/horas
function parseScheduleEntries(text) {
    if (!text || text === 'Sin Horario') return [{ day: 'Sin Definir', time_block: 'Sin Horario' }];

    // Separar por "y", ",", ";" o "/"
    const parts = text.split(/ y |,|;|\/|&/i);
    const results = [];

    parts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;

        const day = detectDay(trimmed);
        const timeBlock = detectTimeBlock(trimmed);

        // Si detectamos un día pero no un bloque, o viceversa, lo agregamos
        if (day !== 'Otros' || timeBlock !== 'Sin Horario') {
            results.push({ day, time_block: timeBlock });
        }
    });

    // Si no detectó nada separado, intentar con el texto completo
    if (results.length === 0) {
        return [{ day: detectDay(text), time_block: detectTimeBlock(text) }];
    }

    return results;
}

function detectDay(text) {
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
    const lower = text.toLowerCase();

    // 1. Prioridad por palabras clave
    if (lower.includes('mañana')) return 'Mañana';
    if (lower.includes('siesta')) return 'Siesta';
    if (lower.includes('tarde') || lower.includes('noche')) return 'Tarde';

    // 2. Detección por números de hora (Ej: "10hs", "18:00")
    const hours = text.match(/(\d+)/g);
    if (hours) {
        for (let h of hours) {
            const hr = parseInt(h);
            if (hr >= 7 && hr <= 12) return 'Mañana';
            if (hr >= 13 && hr <= 15) return 'Siesta';
            if (hr >= 16 && hr <= 22) return 'Tarde';
        }
    }

    return 'Tarde'; // Default
}
