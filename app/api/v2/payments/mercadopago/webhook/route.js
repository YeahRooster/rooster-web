import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        // El ID del pago puede venir en la query string (?id=XXX o ?data.id=XXX)
        let paymentId = searchParams.get('id') || searchParams.get('data.id');

        // Si no está en la query string, intentamos leer el cuerpo de la petición
        if (!paymentId) {
            try {
                const body = await request.json();
                if (body.type === 'payment' && body.data) {
                    paymentId = body.data.id;
                } else if (body.resource && body.topic === 'payment') {
                    // Formato alternativo IPN
                    const parts = body.resource.split('/');
                    paymentId = parts[parts.length - 1];
                }
            } catch (e) {
                // Silencioso, puede ser una petición vacía de prueba
            }
        }

        if (!paymentId) {
            console.log("⚠️ Webhook de MercadoPago recibido sin paymentId válido.");
            return NextResponse.json({ received: true }); // Respondemos 200 a MP para evitar reintentos
        }

        const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!mpAccessToken) {
            console.error("❌ MERCADOPAGO_ACCESS_TOKEN no configurado.");
            return NextResponse.json({ status: 'error', message: 'Configuración de MercadoPago incompleta en el servidor' }, { status: 500 });
        }

        // 1. Consultar el estado del pago en MercadoPago
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`
            }
        });

        if (!mpRes.ok) {
            const errData = await mpRes.json();
            console.error(`❌ Error consultando pago ${paymentId} en MercadoPago:`, errData);
            return NextResponse.json({ status: 'error', message: 'Error consultando estado en MercadoPago' }, { status: 500 });
        }

        const payment = await mpRes.json();

        // 2. Si el pago está aprobado, procesar el impacto en la base de datos
        if (payment.status === 'approved') {
            const metadata = payment.metadata;
            
            if (!metadata || !metadata.alumno_dni || !metadata.pagos_detalles) {
                console.error("❌ Webhook recibido sin metadatos suficientes para registrar el pago:", metadata);
                return NextResponse.json({ received: true });
            }

            const alumnoDni = String(metadata.alumno_dni).trim();
            const pagosDetalles = JSON.parse(metadata.pagos_detalles);

            console.log(`✅ Procesando pago aprobado de MercadoPago. Alumno DNI: ${alumnoDni}, Cuotas:`, pagosDetalles);

            for (const item of pagosDetalles) {
                // Buscar si existe un pago registrado para este alumno, taller, mes y año
                const { data: existingPago, error: findError } = await supabaseAdmin
                    .from('pagos')
                    .select('id')
                    .eq('alumno_dni', alumnoDni)
                    .eq('taller', item.taller)
                    .eq('mes', String(item.mes))
                    .eq('anio', parseInt(item.anio))
                    .maybeSingle();

                if (findError) {
                    console.error(`❌ Error buscando pago existente para taller ${item.taller}:`, findError);
                    continue;
                }

                const paymentData = {
                    alumno_dni: alumnoDni,
                    taller: item.taller,
                    mes: String(item.mes),
                    anio: parseInt(item.anio),
                    estado: 'pagado',
                    monto: parseFloat(item.monto_final),
                    monto_final: parseFloat(item.monto_final),
                    metodo_pago: 'MERCADOPAGO',
                    cuota_numero: parseInt(item.cuota_numero),
                    fecha_pago: payment.date_approved || new Date().toISOString(),
                    fecha_real_pago: payment.date_approved || new Date().toISOString(),
                    observaciones: `Aprobado automáticamente por MercadoPago (ID: ${paymentId})`
                };

                if (existingPago) {
                    // Actualizar pago existente
                    const { error: updErr } = await supabaseAdmin
                        .from('pagos')
                        .update(paymentData)
                        .eq('id', existingPago.id);
                    
                    if (updErr) {
                        console.error(`❌ Error actualizando pago ID ${existingPago.id}:`, updErr);
                    } else {
                        console.log(`✨ Pago ID ${existingPago.id} actualizado con éxito.`);
                    }
                } else {
                    // Insertar nuevo registro
                    const { error: insErr } = await supabaseAdmin
                        .from('pagos')
                        .insert(paymentData);
                    
                    if (insErr) {
                        console.error(`❌ Error insertando nuevo pago:`, insErr);
                    } else {
                        console.log(`✨ Nuevo pago insertado con éxito para ${item.taller} (Mes: ${item.mes}).`);
                    }
                }
            }
        } else {
            console.log(`ℹ️ Pago ${paymentId} recibido con estado: ${payment.status}. No requiere acción en Supabase.`);
        }

        // Siempre responder 200 OK a MercadoPago para confirmar recepción de la notificación
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("❌ Error grave en Webhook de MercadoPago:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
