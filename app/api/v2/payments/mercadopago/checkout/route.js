import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { getSuggestedPayments } from '@/lib/payments';

export async function POST(request) {
    try {
        const { dni } = await request.json();

        if (!dni) {
            return NextResponse.json({ status: 'error', message: 'Falta el DNI del alumno' }, { status: 400 });
        }

        // 1. Obtener los datos del alumno (nombre y mail) para el perfil del pagador
        const { data: alumno, error: alumnoErr } = await supabaseAdmin
            .from('alumnos')
            .select('nombre, email')
            .eq('dni', dni)
            .single();

        if (alumnoErr || !alumno) {
            return NextResponse.json({ status: 'error', message: 'No se encontró el alumno en la base de datos' }, { status: 404 });
        }

        // 2. Obtener las cuotas sugeridas a pagar (utilizando la lógica compartida de TRANSFERENCIA)
        const suggested = await getSuggestedPayments({ alumno_dni: dni, metodo_pago: 'TRANSFERENCIA' });

        if (suggested.status === 'error' || !suggested.items || suggested.items.length === 0) {
            return NextResponse.json({ status: 'error', message: 'No tienes cuotas pendientes por abonar' }, { status: 400 });
        }

        // 3. Obtener URL Base para los redireccionamientos (success, failure, webhook)
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        const baseUrl = `${protocol}://${host}`;

        // 4. Mapear las cuotas a ítems de MercadoPago
        const items = suggested.items.map(item => ({
            title: `${item.taller} - Cuota ${item.cuota_numero} (${item.mes_nombre})`,
            unit_price: Number(item.monto_sugerido),
            quantity: 1,
            currency_id: 'ARS'
        }));

        // 5. Configurar los metadatos que enviaremos a MercadoPago para identificarlos en el Webhook
        const metadata = {
            alumno_dni: dni,
            pagos_detalles: JSON.stringify(suggested.items.map(item => ({
                taller: item.taller,
                cuota_numero: item.cuota_numero,
                mes: item.mes,
                anio: item.anio,
                monto_final: item.monto_sugerido
            })))
        };

        const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!mpAccessToken) {
            console.error("❌ MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno.");
            return NextResponse.json({ status: 'error', message: 'Configuración de MercadoPago incompleta en el servidor' }, { status: 500 });
        }

        // 6. Crear la preferencia en MercadoPago
        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: items,
                payer: {
                    name: alumno.nombre,
                    email: alumno.email || 'rooster.alumno@gmail.com'
                },
                back_urls: {
                    success: `${baseUrl}/mi-cuenta?payment=success`,
                    pending: `${baseUrl}/mi-cuenta?payment=pending`,
                    failure: `${baseUrl}/mi-cuenta?payment=failure`
                },
                auto_return: 'approved',
                metadata: metadata,
                notification_url: `${baseUrl}/api/v2/payments/mercadopago/webhook`
            })
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("❌ Error de MercadoPago:", mpData);
            return NextResponse.json({ status: 'error', message: mpData.message || 'Error al conectar con la pasarela de pago' }, { status: 500 });
        }

        return NextResponse.json({
            status: 'success',
            init_point: mpData.init_point,
            preference_id: mpData.id
        });

    } catch (error) {
        console.error('Error creating checkout preference:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
