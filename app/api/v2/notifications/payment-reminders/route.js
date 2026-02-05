import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { sendPaymentReminderEmail } from '@/lib/email';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== 'rooster-reminders-2026') {
            return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 401 });
        }

        const hoy = new Date();
        const dia = hoy.getDate();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();

        // Calcular el último día del mes corriente
        const ultimoDiaMes = new Date(anioActual, mesActual, 0).getDate();

        let tipoAlerta = '';
        let mesDeuda = mesActual;
        let anioDeuda = anioActual;

        // 1. Alerta PROXIMO: 4 días antes de que termine el mes (ej: del 24 al 28 en febrero)
        if (dia >= (ultimoDiaMes - 4) && dia <= ultimoDiaMes) {
            tipoAlerta = 'PROXIMO';
            mesDeuda = mesActual;
            anioDeuda = anioActual;
        }
        // 2. Alerta VENCIDO: Días 1 o 2 del mes siguiente
        else if (dia === 1 || dia === 2) {
            tipoAlerta = 'VENCIDO';
            // Verificamos si debe el mes que acaba de terminar
            mesDeuda = mesActual === 1 ? 12 : mesActual - 1;
            anioDeuda = mesActual === 1 ? anioActual - 1 : anioActual;
        }

        if (!tipoAlerta) {
            return NextResponse.json({
                status: 'success',
                message: `Hoy (día ${dia}) no corresponde enviar alertas automáticas.`
            });
        }

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mesNombreDeuda = meses[mesDeuda - 1];

        console.log(`🚀 Iniciando alertas: Tipo ${tipoAlerta} | Verificando Mes: ${mesNombreDeuda} ${anioDeuda}`);

        // 1. Alumnos activos con notificaciones habilitadas
        const { data: alumnos, error: errAl } = await supabaseAdmin
            .from('alumnos')
            .select('*')
            .eq('activo', true)
            .eq('notificaciones_activas', true);

        if (errAl) throw errAl;

        const resultados = [];

        for (const alumno of alumnos) {
            // Evitar duplicados (no enviar la misma alerta el mismo mes real de ejecución)
            if (alumno.ultima_notificacion_mes === mesActual &&
                alumno.ultima_notificacion_anio === anioActual &&
                alumno.ultima_notificacion_tipo === tipoAlerta) {
                continue;
            }

            // 2. Verificar deuda del mes objetivo
            const [inscRes, pagosRes] = await Promise.all([
                supabaseAdmin.from('inscripciones').select('id').eq('alumno_dni', alumno.dni),
                supabaseAdmin.from('pagos').select('id').eq('alumno_dni', alumno.dni).eq('mes', mesDeuda).eq('anio', anioDeuda).eq('estado', 'pagado')
            ]);

            const inscripcionesCount = inscRes.data?.length || 0;
            const pagosCount = pagosRes.data?.length || 0;

            if (pagosCount < inscripcionesCount) {
                console.log(`📧 Enviando recordatorio (${tipoAlerta}) a ${alumno.nombre} por mes ${mesNombreDeuda}`);

                const emailRes = await sendPaymentReminderEmail({
                    to: alumno.email,
                    name: alumno.nombre,
                    mesNombre: mesNombreDeuda,
                    tipo: tipoAlerta
                });

                if (emailRes.success) {
                    await supabaseAdmin
                        .from('alumnos')
                        .update({
                            ultima_notificacion_mes: mesActual,
                            ultima_notificacion_anio: anioActual,
                            ultima_notificacion_tipo: tipoAlerta
                        })
                        .eq('dni', alumno.dni);

                    resultados.push({ nombre: alumno.nombre, status: 'enviado' });
                } else {
                    resultados.push({ nombre: alumno.nombre, status: 'error', error: emailRes.error });
                }
            } else {
                resultados.push({ nombre: alumno.nombre, status: 'al dia' });
            }
        }

        return NextResponse.json({
            status: 'success',
            tipoAlerta,
            mesVerificado: `${mesNombreDeuda} ${anioDeuda}`,
            total_procesados: resultados.length,
            enviados: resultados.filter(r => r.status === 'enviado').length
        });

    } catch (error) {
        console.error('Error in payment reminders:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
