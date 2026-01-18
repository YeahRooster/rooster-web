import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/config/supabaseAdmin';
// Importar SDKs reales cuando el usuario provea credenciales
// import mercadopago from 'mercadopago'; 
// import paypal from '@paypal/checkout-server-sdk';

export async function POST(request) {
    try {
        const { alumno_dni, monto_a_cobrar, concepto } = await request.json();

        // 1. Obtener datos del alumno para saber país
        const { data: alumno, error: alErr } = await supabaseAdmin
            .from('alumnos')
            .select('nombre, email, pais')
            .eq('dni', alumno_dni)
            .single();

        if (alErr || !alumno) throw new Error('Alumno no encontrado');

        const esExtranjero = alumno.pais && alumno.pais.toLowerCase() !== 'argentina';
        let paymentLink = '';
        let paymentType = '';

        if (esExtranjero) {
            // Lógica PAYPAL (Mantenemos para extranjeros)
            paymentType = 'PAYPAL';
            paymentLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rooster.pagos@gmail.com&currency_code=USD&amount=${monto_a_cobrar}&item_name=${encodeURIComponent(concepto)}`;
        } else {
            // Lógica TRANSFERENCIA (Alias: escuelarooster)
            paymentType = 'TRANSFERENCIA';
            // No hay "link" directo a app bancaria universal, devolvemos datos para el mensaje
            paymentLink = `Hola ${alumno.nombre}! 👋\n\nAcá te paso los datos para abonar la ${concepto}.\n\n💰 Monto: $${monto_a_cobrar}\n🏦 Alias: escuelarooster\n\nPor favor enviame el comprobante una vez realizado. Gracias! 🐔`;
        }

        // Aquí se podría enviar el email automáticamente si se quisiera
        // await sendEmail(alumno.email, paymentLink, ...);

        return NextResponse.json({
            status: 'success',
            link: paymentLink, // En caso de transferencia, esto es el mensaje completo
            type: paymentType,
            datos_bancos: {
                alias: 'escuelarooster',
                cbu: '', // Opcional si querés agregarlo
                titular: 'Escuela Rooster'
            },
            message: `Datos de ${paymentType} generados correctamente`
        });

    } catch (error) {
        console.error('Error generating coupon:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
