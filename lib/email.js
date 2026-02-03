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
    // Diagnóstico de variables de entorno (sin mostrar la clave completa)
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
        // Si el error es "Invalid login", es probable que el password de app esté mal o bloqueado
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
                    <a href="https://roosterespacio.com.ar" style="color: #ffcc00; text-decoration: none; font-weight: bold; margin: 0 10px;">Sitio Web</a>
                    <a href="https://instagram.com/roosterespacio" style="color: #ffcc00; text-decoration: none; font-weight: bold; margin: 0 10px;">Instagram</a>
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Envía los correos de inscripción (Alumno y Admin)
 */
export async function sendEnrollmentEmails(studentData) {
    const { name, email, workshopTitle, selectedSchedules, dni, phone, tutorName, experiencia, conocio } = studentData;
    const ADMIN_EMAIL = process.env.EMAIL_USER;

    if (!email) {
        console.error("❌ ERROR: No se puede enviar mail al alumno porque falta el email.");
        return;
    }

    // 1. Email para el ALUMNO
    const alunoHtml = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${name}! 👋</h2>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Recibimos tu solicitud de inscripción correctamente. Estamos muy felices de que quieras sumarte a nuestra comunidad creativa.
        </p>
        
        <div style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #333;">Taller: ${workshopTitle}</p>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;"><strong>Horarios:</strong> ${selectedSchedules}</p>
        </div>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Tu inscripción se encuentra actualmente en estado <strong>PENDIENTE</strong>. En las próximas 24-48 horas un docente revisará el cupo y se pondrá en contacto con vos para confirmar tu lugar y los pasos a seguir.
        </p>
        
        <div style="text-align: center; margin-top: 35px;">
            <a href="https://roosterespacio.com.ar/mi-cuenta" style="background-color: #1a1a1a; color: #ffcc00; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Ver mi cuenta</a>
        </div>
    `);

    // 2. Email para el ADMIN
    const adminHtml = getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">Nueva Solicitud de Inscripción 🎨</h2>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>Alumno:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>DNI:</strong> ${dni}</p>
            <p style="margin: 8px 0;"><strong>Taller:</strong> ${workshopTitle}</p>
            <p style="margin: 8px 0;"><strong>Horarios:</strong> ${selectedSchedules}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Teléfono:</strong> ${phone}</p>
            ${tutorName ? `<p style="margin: 8px 0;"><strong>Tutor:</strong> ${tutorName}</p>` : ''}
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p style="margin: 8px 0;"><strong>Experiencia previa:</strong> ${experiencia || 'No especifica'}</p>
                <p style="margin: 8px 0;"><strong>¿Cómo nos conoció?:</strong> ${conocio || 'No especifica'}</p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://roosterespacio.com.ar/admin" style="background-color: #ffcc00; color: #000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Revisar en Panel Admin</a>
        </div>
    `);

    // Enviar ambos (en paralelo, pero esperamos ambos)
    return Promise.all([
        sendEmail({ to: email, subject: `Inscripción Recibida: ${workshopTitle} - Rooster`, html: alunoHtml }),
        sendEmail({ to: ADMIN_EMAIL, subject: `NUEVA INSCRIPCIÓN: ${name} (${workshopTitle})`, html: adminHtml })
    ]);
}
