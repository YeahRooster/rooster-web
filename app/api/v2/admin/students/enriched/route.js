import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function GET(request) {
    try {
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();

        // 1. Obtener todos los alumnos activos
        const { data: alumnos, error: alErr } = await supabaseAdmin
            .from('alumnos')
            .select('*')
            .order('nombre');

        if (alErr) throw alErr;

        // 2. Obtener inscripciones
        const { data: inscripciones, error: insErr } = await supabaseAdmin
            .from('inscripciones')
            .select(`
                *,
                talleres(id, titulo, precio_base, precio_desc_efectivo)
            `);

        if (insErr) throw insErr;

        // 3. Obtener todos los pagos (para ver deudas históricas)
        const { data: todosLosPagos, error: pagErr } = await supabaseAdmin
            .from('pagos')
            .select('alumno_dni, taller, estado, monto, mes, anio');

        if (pagErr) throw pagErr;

        // 4. Enriquecer datos
        const enriched = alumnos.map(al => {
            const alInsc = inscripciones.filter(i => i.alumno_dni === al.dni);
            const misPagos = todosLosPagos.filter(p => p.alumno_dni === al.dni);

            // Un alumno está "Al día" si NO tiene registros con estado 'pendiente' 
            // correspondientes a meses <= al mes actual.
            const tieneDeudas = misPagos.some(p => {
                const indPago = p.anio * 12 + (p.mes - 1);
                const indHoy = anioActual * 12 + (mesActual - 1);
                return p.estado === 'pendiente' && indPago <= indHoy;
            });

            const estaAlDia = alInsc.length > 0 && !tieneDeudas;

            // Calculamos el costo mensual total (suma de talleres o monto personalizado)
            const cuotaTotal = alInsc.reduce((acc, ins) => {
                return acc + (ins.monto_personalizado || ins.talleres?.precio_base || 0);
            }, 0);

            const talleresNombres = alInsc.map(i => i.talleres?.titulo || i.taller_nombre).filter(Boolean);

            return {
                ...al,
                talleres: talleresNombres,
                talleresInscriptos: talleresNombres,
                paga_este_mes: estaAlDia,
                cuota_total: cuotaTotal,
                inscripciones: alInsc.map(i => ({
                    id: i.id,
                    taller: i.talleres?.titulo || i.taller_nombre,
                    monto: i.monto_personalizado || i.talleres?.precio_base || 0,
                    es_personalizado: !!i.monto_personalizado
                }))
            };
        });

        return NextResponse.json({ status: 'success', data: enriched });
    } catch (error) {
        console.error("❌ Error en GET /api/v2/admin/students/enriched:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
