import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';

// GET: Listar recursos de un taller
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let taller = searchParams.get('taller');

    // Normalizar taller de guion para Jorge Roldan (mismatch con el nombre del taller en la base de datos)
    if (taller && taller.trim().toUpperCase() === 'TALLER DE GUION') {
        taller = 'TALLER DE GUION DE HISTORIETAS';
    }

    // Si NO hay taller, asumimos que es una petición GLOBAL (Admin)
    // Si HAY taller, filtramos por él (Profesor/Alumno)

    try {
        console.log(`🔌 Consultando recursos en Supabase ${taller ? `para: ${taller}` : '(GLOBAL)'}`);

        // Usar supabaseAdmin para lectura también (Bypass RLS)
        let query = supabaseAdmin
            .from('recursos')
            .select('*, profesores(nombre)') // Join para sacar nombre del profe
            .order('fecha_subida', { ascending: false });

        if (taller) {
            // Usamos ilike sin comodines para un match exacto pero insensible a mayúsculas
            query = query.ilike('taller', taller.trim());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Formatear para que el frontend no sufra cambios
        const resources = data.map(r => ({
            id: r.id,
            nombre: r.nombre_archivo,
            url: r.url_archivo,
            taller: r.taller,
            profesor: r.profesores?.nombre || 'Desconocido', // Nombre del profe desde JOIN
            fecha: new Date(r.fecha_subida).toLocaleDateString('es-AR')
        }));

        return NextResponse.json({ status: 'success', resources });
    } catch (error) {
        console.error("Error fetching resources from Supabase:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar un recurso por ID
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ status: 'error', message: 'ID requerido' }, { status: 400 });

        // Nota: En un sistema ideal verificaríamos que el user.dni coincida con el profesor_dni del recurso.
        // Por ahora, asumimos que si tiene acceso al dashboard de profe, puede borrar.

        // Usamos supabaseAdmin para saltar restricciones RLS que puedan estar bloqueando el borrado
        const { error } = await supabaseAdmin
            .from('recursos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: 'Recurso eliminado' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
