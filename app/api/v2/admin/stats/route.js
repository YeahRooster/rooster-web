import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET() {
    try {
        console.log("--- SUPABASE ADMIN STATS v2 ---");

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const { data: todosPagos, error: pErr } = await supabaseAdmin
            .from('pagos')
            .select('monto, monto_final, taller, fecha_pago, fecha_real_pago')
            .eq('estado', 'pagado');

        if (pErr) throw pErr;

        // Filtrar los pagos cuya fecha REAL de cobro cae en el mes actual
        const pagos = (todosPagos || []).filter(p => {
            const fechaStr = p.fecha_real_pago || p.fecha_pago;
            if (!fechaStr) return false;
            const fecha = new Date(fechaStr);
            return fecha.getFullYear() === currentYear && (fecha.getMonth() + 1) === currentMonth;
        });

        // 1.1 Obtener comisiones de talleres
        const { data: talleresInfo } = await supabaseAdmin
            .from('talleres')
            .select('titulo, comision');
        
        const comisionMap = {};
        talleresInfo?.forEach(t => {
            comisionMap[t.titulo.toLowerCase().trim()] = t.comision || 1.0;
        });

        const netoMensual = pagos.reduce((sum, p) => {
            const comision = comisionMap[(p.taller || '').toLowerCase().trim()] || 1.0;
            const montoUsado = parseFloat(p.monto_final || p.monto || 0);
            return sum + (montoUsado * comision);
        }, 0);

        // 2. Total Alumnos (Conteo físico en tabla alumnos)
        const { count: totalAlumnos, error: aErr } = await supabaseAdmin
            .from('alumnos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        if (aErr) throw aErr;

        // 3. Total Profesores
        const { count: totalProfesores, error: prErr } = await supabaseAdmin
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
