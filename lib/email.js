import nodemailer from 'nodemailer';

/**
 * Configuración del Transporter para Gmail
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password de Google
    },
});

/**
 * Función genérica para enviar correos HTML
 */
export async function sendEmail({ to, subject, html }) {
    const userSet = !!process.env.EMAIL_USER;
    const passSet = !!process.env.EMAIL_PASSWORD;

    if (!userSet || !passSet) {
        console.error('❌ ERROR CRÍTICO: EMAIL_USER o EMAIL_PASSWORD no detectados en el entorno (Vercel).');
        return { success: false, error: 'Credenciales faltantes' };
    }

    const mailOptions = {
        from: `"Rooster Espacio" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        console.log(`📡 [EMAIL SERVICE] Intentando enviar a: ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [EMAIL SERVICE] Enviado con ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [EMAIL SERVICE] Error al enviar a ${to}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Genera la plantilla HTML para notificaciones de Rooster
 */
export function getEmailTemplate(content) {
    return `
    <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <!-- Navbar / Logo -->
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                <h1 style="color: #ffcc00; margin: 0; font-size: 28px; letter-spacing: 2px;">ROOSTER</h1>
                <p style="color: #ffffff; margin: 5px 0 0; font-size: 12px; text-transform: uppercase;">Espacio Creativo</p>
            </div>
            
            <!-- Cuerpo del Mensaje -->
            <div style="padding: 40px 30px;">
                ${content}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #777777; font-size: 14px; margin: 0;">&copy; 2026 Rooster Espacio. Todos los derechos reservados.</p>
                <div style="margin-top: 15px;">
                    <a href="https://rooster-web-orcin.vercel.app" style="color: #ffcc00; text-decoration: none; font-weight: bold; margin: 0 10px;">Sitio Web</a>
                    <a href="https://instagram.com/roosterespacio" style="color: #ffcc00; text-decoration: none; font-weight: bold; margin: 0 10px;">Instagram</a>
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Envía los correos de inscripción
 */
export async function sendEnrollmentEmails(studentData) {
    const { name, email, workshopTitle, selectedSchedules, dni, phone, tutorName, experiencia, conocio } = studentData;
    const ADMIN_EMAIL = process.env.EMAIL_USER;

    if (!email) return;

    const alunoHtml = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${name}! 👋</h2>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">Recibimos tu solicitud de inscripción correctamente.</p>
        <div style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #333;">Taller: ${workshopTitle}</p>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;"><strong>Horarios:</strong> ${selectedSchedules}</p>
        </div>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">Tu inscripción se encuentra actualmente en estado <strong>PENDIENTE</strong>.</p>
        <div style="text-align: center; margin-top: 35px;">
            <a href="https://rooster-web-orcin.vercel.app/mi-cuenta" style="background-color: #1a1a1a; color: #ffcc00; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Ver mi cuenta</a>
        </div>
    `);

    const adminHtml = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">Nueva Solicitud de Inscripción 🎨</h2>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
            <p><strong>Alumno:</strong> ${name}</p>
            <p><strong>DNI:</strong> ${dni}</p>
            <p><strong>Taller:</strong> ${workshopTitle}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
            <p><strong>Dirección:</strong> ${studentData.address}</p>
            <p><strong>Localidad:</strong> ${studentData.locality}</p>
            <p><strong>Ciudad:</strong> ${studentData.city}</p>
            ${tutorName ? `<p><strong>Tutor (Menor):</strong> ${tutorName} - <strong>Celular Tutor:</strong> ${studentData.parentPhone}</p>` : ''}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p><strong>Experiencia:</strong> ${experiencia || 'No especifica'}</p>
                <p><strong>Conoció por:</strong> ${conocio || 'No especifica'}</p>
            </div>
        </div>
    `);

    return Promise.all([
        sendEmail({ to: email, subject: `Inscripción Recibida: ${workshopTitle} - Rooster`, html: alunoHtml }),
        sendEmail({ to: ADMIN_EMAIL, subject: `NUEVA INSCRIPCIÓN: ${name} (${workshopTitle})`, html: adminHtml })
    ]);
}

/**
 * Envía recordatorios de pago
 */
export async function sendPaymentReminderEmail({ to, name, mesNombre, tipo }) {
    let subject, title, body, color;

    if (tipo === 'PROXIMO') {
        subject = `Recordatorio de Pago: Cuota de ${mesNombre} - Rooster`;
        title = `¡Hola ${name}! 👋`;
        body = `
            Te recordamos que la cuota de <strong>${mesNombre}</strong> está próxima a vencer.
            <br/><br/>
            Si ya realizaste el pago, por favor desestimá este mensaje. De lo contrario, podés regularizar tu situación desde tu cuenta para asegurar tu lugar.
        `;
        color = '#ffcc00';
    } else {
        subject = `Aviso de Cuota Vencida: ${mesNombre} - Rooster`;
        title = `¡Hola ${name}!`;
        body = `
            Te informamos que la cuota del mes de <strong>${mesNombre}</strong> se encuentra vencida.
            <br/><br/>
            Para regularizar tu situación, te pedimos por favor que realices el pago a la brevedad desde el portal de alumnos.
        `;
        color = '#ff4d4d';
    }

    const html = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
            ${body}
        </p>
        <div style="text-align: center; margin-top: 35px;">
            <a href="https://rooster-web-orcin.vercel.app/mi-cuenta" style="background-color: #1a1a1a; color: ${color}; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Ir a Mi Cuenta</a>
        </div>
    `);


    return sendEmail({ to, subject, html });
}

/**
 * Envía notificación de nuevo material compartido
 */
export async function sendResourceNotificationEmail({ to, studentName, teacherName, workshopName, resourceName }) {
    const subject = `Nuevo material en ${workshopName} - Rooster`;

    const html = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${studentName}! 🎨</h2>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Tu profesor <strong>${teacherName}</strong> ha compartido nuevo material en el taller de <strong>${workshopName}</strong>.
        </p>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffcc00;">
            <p style="margin: 0; font-weight: bold; color: #333;">Recurso: ${resourceName}</p>
        </div>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Ya podés acceder a este material desde tu cuenta en la sección "Material Compartido".
        </p>
        <div style="text-align: center; margin-top: 35px;">
            <a href="https://rooster-web-orcin.vercel.app/mi-cuenta" style="background-color: #1a1a1a; color: #ffcc00; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Ver material</a>
        </div>
    `);

    return sendEmail({ to, subject, html });
}
