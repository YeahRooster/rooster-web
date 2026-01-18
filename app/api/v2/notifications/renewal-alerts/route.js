import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
// import { sendEmail } from '@/lib/email'; // Asumimos helper de email existente o mock

export async function POST() {
    try {
        // 1. Buscar inscripciones que vencen en el próximo mes (aprox 30 días)
        const hoy = new Date();
        const enUnMes = new Date();
        enUnMes.setDate(hoy.getDate() + 45); // Miramos un poco más allá para pillar a los del mes 11

        const { data: porVencer, error } = await supabaseAdmin
            .from('inscripciones')
            .select(`
                *,
                alumnos (nombre, email, telefono, pais),
                talleres (titulo, precio_inscripcion_anual)
            `)
            .eq('estado_inscripcion', 'VIGENTE') // Solo vigentes
            .lte('fecha_vencimiento_ciclo', enUnMes.toISOString())
            .gte('fecha_vencimiento_ciclo', hoy.toISOString());

        if (error) throw error;

        const notificados = [];

        // 2. Procesar cada alumno
        for (const insc of porVencer) {
            // Calcular si está en mes 11
            const fechasDiff = new Date(insc.fecha_vencimiento_ciclo) - new Date();
            const diasParaVencer = Math.ceil(fechasDiff / (1000 * 60 * 60 * 24));

            // Enviamos alerta si faltan entre 20 y 40 días (aprox mes 11)
            // O si simplemente queremos notificar a todos los "por vencer"

            const mensaje = `Hola ${insc.alumnos.nombre}! Tu inscripción anual al ${insc.talleres.titulo} vence el ${insc.fecha_vencimiento_ciclo}. Recordá que si renovás antes del día 10 tenés 50% de descuento!`;

            // Simular envío (aquí iría sendEmail o WhatsApp API)
            console.log(`[ALERTA RENOVACIÓN] Enviando a ${insc.alumnos.email}: ${mensaje}`);

            // Actualizar estado a 'POR_VENCER' si no lo estaba
            if (insc.estado_inscripcion !== 'POR_VENCER') {
                await supabaseAdmin
                    .from('inscripciones')
                    .update({ estado_inscripcion: 'POR_VENCER' })
                    .eq('id', insc.id);
            }

            notificados.push({
                alumno: insc.alumnos.nombre,
                vence: insc.fecha_vencimiento_ciclo,
                diasRestantes: diasParaVencer
            });
        }

        return NextResponse.json({
            status: 'success',
            procesados: notificados.length,
            detalles: notificados
        });

    } catch (error) {
        console.error('Error sending alerts:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
