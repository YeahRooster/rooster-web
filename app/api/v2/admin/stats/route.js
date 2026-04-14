import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function GET() {
    try {
        console.log("--- SUPABASE ADMIN STATS v2 ---");

        // 1. Neto Mensual (Suma de pagos del mes actual)
        const mesActual = new Date().getMonth() + 1;
        const anioActual = new Date().getFullYear();

        const { data: pagos, error: pErr } = await supabase
            .from('pagos')
            .select('monto')
            .eq('mes', String(mesActual))
            .eq('anio', anioActual)
            .eq('estado', 'pagado');

        if (pErr) throw pErr;

        const netoMensual = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

        // 2. Total Alumnos (Conteo físico en tabla alumnos)
        const { count: totalAlumnos, error: aErr } = await supabase
            .from('alumnos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        if (aErr) throw aErr;

        // 3. Total Profesores
        const { count: totalProfesores, error: prErr } = await supabase
            .from('profesores')
            .select('*', { count: 'exact', head: true });

        if (prErr) throw prErr;

        return NextResponse.json({
            status: 'success',
            netoMensual: Math.round(netoMensual),
            totalAlumnos: totalAlumnos || 0,
            totalProfesores: totalProfesores || 0
        });

    } catch (error) {
        console.error("Error fetching admin stats from Supabase:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
