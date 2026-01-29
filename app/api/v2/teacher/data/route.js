import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tallerNombre = searchParams.get('taller');

    if (!tallerNombre) {
        return NextResponse.json({ status: 'error', message: 'Taller requerido' }, { status: 400 });
    }

    try {
        console.log(`--- SUPABASE TEACHER DATA v2 for: ${tallerNombre} ---`);

        // 1. Obtener alumnos inscriptos en este taller
        const { data: inscripciones, error: iErr } = await supabaseAdmin
            .from('inscripciones')
            .select(`
                alumno_dni,
                alumnos (nombre)
            `)
            .ilike('taller_nombre', `%${tallerNombre}%`);

        if (iErr) throw iErr;

        // 2. Obtener pagos del mes actual para estos alumnos
        const mesActual = new Date().getMonth() + 1;
        const anioActual = new Date().getFullYear();

        const dnis = inscripciones.map(i => i.alumno_dni);

        const { data: pagos, error: pErr } = await supabaseAdmin
            .from('pagos')
            .select('alumno_dni, estado')
            .in('alumno_dni', dnis)
            .ilike('taller', `%${tallerNombre}%`) // FILTRO POR TALLER ESPECÍFICO
            .eq('mes', String(mesActual))
            .eq('anio', anioActual)
            .eq('estado', 'pagado');

        if (pErr) throw pErr;

        const pagosMap = {};
        pagos.forEach(p => pagosMap[p.alumno_dni] = true);

        // 3. Formatear respuesta
        const students = inscripciones.map(i => ({
            nombre: i.alumnos.nombre,
            estado: pagosMap[i.alumno_dni] ? "al dia" : "deudor"
        }));

        // NOTA: Los recursos siguen viniendo de Drive por ahora hasta que hagamos Fase 5
        // Pero los devolvemos vacíos o el front puede seguir usando la v1 para eso si prefiere.
        // Mejor devolvemos solo alumnos y que el front maneje la v1 de recursos separada por ahora.

        return NextResponse.json({
            status: 'success',
            students
        });

    } catch (error) {
        console.error("Error fetching teacher data from Supabase:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
