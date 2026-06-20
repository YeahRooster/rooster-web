import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET() {
    try {
        const { data: profesores, error } = await supabaseAdmin
            .from('profesores')
            .select('dni, nombre, email, taller_asignado, password') // traemos la password para el admin
            .order('nombre', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ status: 'success', data: profesores });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { dni, nombre, email, password, taller } = body;

        if (!dni || !nombre || !password) {
            return NextResponse.json({ status: 'error', message: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('profesores')
            .insert({
                dni: String(dni).trim(),
                nombre: String(nombre).trim(),
                email: email ? String(email).trim() : null,
                password: String(password).trim(),
                taller_asignado: taller ? String(taller).trim() : null
            });

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ status: 'error', message: 'Ya existe un profesor con este DNI' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { dni, nombre, email, password, taller } = body;

        if (!dni) {
            return NextResponse.json({ status: 'error', message: 'Falta el DNI' }, { status: 400 });
        }

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = String(nombre).trim();
        if (email !== undefined) updateData.email = email ? String(email).trim() : null;
        if (password !== undefined && password.trim() !== '') updateData.password = String(password).trim();
        if (taller !== undefined) updateData.taller_asignado = taller ? String(taller).trim() : null;

        const { error } = await supabaseAdmin
            .from('profesores')
            .update(updateData)
            .eq('dni', String(dni).trim());

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dni = searchParams.get('dni');

        if (!dni) {
            return NextResponse.json({ status: 'error', message: 'Falta el DNI' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('profesores')
            .delete()
            .eq('dni', String(dni).trim());

        if (error) throw error;

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
