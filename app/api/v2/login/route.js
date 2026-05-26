import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function POST(request) {
    try {
        const { dni, password } = await request.json();
        const cleanDni = String(dni || "").trim();
        const cleanPass = String(password || "").trim();

        // 1. Intentar Admin (Múltiples credenciales)
        if ((cleanDni === "999" || cleanDni === "admin") && cleanPass === "adminRooster") {
            return NextResponse.json({
                status: 'success',
                role: 'admin',
                nombre: 'Administrador',
                dni: cleanDni
            });
        }

        // 2. Intentar Profesor
        const { data: teacher, error: tErr } = await supabase
            .from('profesores')
            .select('*')
            .eq('dni', cleanDni)
            .eq('password', cleanPass)
            .single();

        if (teacher) {
            return NextResponse.json({
                status: 'success',
                role: 'teacher',
                nombre: teacher.nombre,
                taller: teacher.taller_asignado,
                dni: teacher.dni
            });
        }

        // 3. Intentar Alumno
        const { data: student, error: sErr } = await supabase
            .from('alumnos')
            .select('*, inscripciones(taller_nombre), pagos(*)')
            .eq('dni', cleanDni)
            .eq('password', cleanPass)
            .single();

        if (student) {
            // VALIDACIÓN: Solo permitir login si el alumno está activo
            if (student.activo === false) {
                return NextResponse.json({
                    status: 'error',
                    message: 'Tu cuenta está pendiente de aprobación por la administración de Rooster.'
                }, { status: 403 });
            }

            // Transformar inscripciones a array simple de nombres
            const talleresInscriptos = student.inscripciones?.map(i => i.taller_nombre) || [];

            return NextResponse.json({
                status: 'success',
                role: 'student',
                nombre: student.nombre,
                email: student.email,
                dni: student.dni,
                talleresInscriptos,
                pagos: student.pagos || [],
                avatar_id: student.avatar_id || 'gallo',
                avatar_url: student.avatar_url,
                acceso_restringido: student.acceso_restringido || false
            });
        }

        return NextResponse.json({ status: 'error', message: 'DNI o contraseña incorrectos' }, { status: 401 });

    } catch (error) {
        console.error("Login error v2:", error);
        return NextResponse.json({ status: 'error', message: 'Error en el servidor' }, { status: 500 });
    }
}
