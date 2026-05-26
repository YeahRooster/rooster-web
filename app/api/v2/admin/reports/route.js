import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET() {
    try {
        const { data: pagos, error } = await supabaseAdmin
            .from('pagos')
            .select('mes, anio, monto, monto_final, estado, metodo_pago, alumno_dni, taller')
            .eq('estado', 'pagado');

        if (error) throw error;

        const { data: talleres, error: tErr } = await supabaseAdmin
            .from('talleres')
            .select('titulo, comision');
            
        if (tErr) throw tErr;

        const comisionesMap = {};
        talleres.forEach(t => {
            comisionesMap[t.titulo.toLowerCase().trim()] = t.comision || 1.0;
        });

        // Agrupar por anio y mes
        const historico = {};
        const alumnosPorMes = {};

        pagos.forEach(p => {
            const key = `${p.anio}-${p.mes.toString().padStart(2, '0')}`;
            if (!historico[key]) historico[key] = 0;
            if (!alumnosPorMes[key]) alumnosPorMes[key] = new Set();

            const comision = comisionesMap[(p.taller || '').toLowerCase().trim()] || 1.0;
            const neto = parseFloat(p.monto_final || p.monto || 0) * comision;

            historico[key] += neto;
            alumnosPorMes[key].add(p.alumno_dni);
        });

        // Convertir a array y ordenar
        const reportData = Object.keys(historico)
            .sort()
            .map(key => {
                const [anio, mes] = key.split('-');
                return {
                    label: `${mes}/${anio}`,
                    mes: parseInt(mes),
                    anio: parseInt(anio),
                    ingresos: historico[key],
                    alumnos_pagaron: alumnosPorMes[key].size
                };
            });

        return NextResponse.json({ status: 'success', data: reportData });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
