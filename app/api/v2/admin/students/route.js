import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'active' o 'pending'

        let query = supabase.from('alumnos').select('*').order('created_at', { ascending: false });

        if (status === 'pending') {
            query = query.eq('activo', false);
        } else if (status === 'active') {
            query = query.eq('activo', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ status: 'success', data });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { dni, activo, notificaciones_activas, acceso_restringido, nombre, email, telefono } = body;
        const cleanDni = String(dni).trim();

        // 1. Validar Email Duplicado si se está modificando el correo
        if (email && email.trim() !== "") {
            const cleanEmail = email.trim();
            const { data: existingEmail } = await supabaseAdmin
                .from('alumnos')
                .select('dni, nombre')
                .eq('email', cleanEmail)
                .neq('dni', cleanDni)
                .maybeSingle();

            if (existingEmail) {
                return NextResponse.json({
                    status: 'error',
                    message: `El email ${cleanEmail} ya está registrado para otro alumno (DNI: ${existingEmail.dni}, Nombre: ${existingEmail.nombre || 'Sin nombre'}).`
                }, { status: 400 });
            }
        }

        const updateData = {};
        if (activo !== undefined) updateData.activo = activo;
        if (notificaciones_activas !== undefined) updateData.notificaciones_activas = notificaciones_activas;
        if (acceso_restringido !== undefined) updateData.acceso_restringido = acceso_restringido;
        if (nombre !== undefined) updateData.nombre = nombre.trim();
        if (email !== undefined) updateData.email = email ? email.trim() : null;
        if (telefono !== undefined) updateData.telefono = telefono ? telefono.trim() : null;

        const { error } = await supabaseAdmin
            .from('alumnos')
            .update(updateData)
            .eq('dni', cleanDni);

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("❌ Error en PUT /api/v2/admin/students:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// POST: Registrar nuevo alumno
export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, nombre, email, telefono, talleres } = body;

        if (!dni || !nombre) {
            return NextResponse.json({ status: 'error', message: 'DNI y Nombre son obligatorios' }, { status: 400 });
        }

        const cleanDni = String(dni).trim();

        // 0. Verificar si el email ya existe para OTRO DNI
        if (email) {
            const { data: existingEmail, error: emailCheckErr } = await supabaseAdmin
                .from('alumnos')
                .select('dni, nombre')
                .eq('email', email)
                .neq('dni', cleanDni)
                .maybeSingle();

            if (existingEmail) {
                return NextResponse.json({
                    status: 'error',
                    message: `El email ${email} ya está registrado para otro alumno (DNI: ${existingEmail.dni}, Nombre: ${existingEmail.nombre || 'Sin nombre'}). Debes usar otro email o corregir el registro existente.`
                }, { status: 400 });
            }
        }

        // 1. Insertar o actualizar alumno en Supabase
        // Primero verificamos si existe para no pisar la contraseña si ya tiene una distinta al DNI
        const { data: existingStudent } = await supabaseAdmin
            .from('alumnos')
            .select('password')
            .eq('dni', cleanDni)
            .maybeSingle();

        const studentData = {
            dni: cleanDni,
            nombre,
            email,
            telefono,
            activo: true
        };

        if (!existingStudent) {
            // Es nuevo alumno: ponemos el DNI como password por defecto
            studentData.password = cleanDni;
        }

        const { error: alErr } = await supabaseAdmin
            .from('alumnos')
            .upsert(studentData);

        if (alErr) throw alErr;

        // 2. Insertar inscripciones si se proveen talleres
        if (talleres && talleres.length > 0) {
            const inscripciones = talleres.map(tId => ({
                alumno_dni: cleanDni,
                taller_id: tId
            }));

            const { error: insErr } = await supabaseAdmin
                .from('inscripciones')
                .insert(inscripciones);

            if (insErr) console.error("⚠️ Error insertando inscripciones:", insErr);
        }

        return NextResponse.json({ status: 'success', message: 'Alumno registrado con éxito' });
    } catch (error) {
        console.error("❌ Error en POST /api/v2/admin/students:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
