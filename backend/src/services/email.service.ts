import nodemailer from 'nodemailer';

interface EmailResult {
    success: boolean;
    messageId: string;
    id?: string;
    error?: unknown;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use 587 for TLS if 465 fails
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    }
});

/**
 * Función genérica de envío de correos
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<EmailResult> => {
    try {
        console.log('Enviando correo a:', to);
        const mailOptions = {
            from: `"UIDEportes" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html // Changed from text to html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.messageId);
        return {
            success: true,
            messageId: "Correo enviado exitosamente",
            id: info.messageId
        }
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return {
            success: false,
            messageId: "Error al enviar correo",
            error: error
        }
    }
};

// --- Templates ---

export const sendWelcomeEmail = async (user: { email: string, nombres: string }) => {
    const subject = '¡Bienvenido a UIDEportes! 🏅';
    const html = `
        <h1>Hola ${user.nombres},</h1>
        <p>Te damos la bienvenida a la plataforma oficial de deportes de la UIDE.</p>
        <p>Ya puedes acceder a tu cuenta y participar en los torneos universitarios.</p>
        <br>
        <p>Atentamente,<br>El equipo de UIDEportes</p>
    `;
    return sendEmail(user.email, subject, html);
};

export const sendTeamCreationEmail = async (team: { nombre: string }, captain: { email: string, nombres: string }) => {
    const subject = `Equipo creado: ${team.nombre} ⚽`;
    const html = `
        <h1>¡Felicidades, Capitán ${captain.nombres}!</h1>
        <p>Tu equipo <strong>${team.nombre}</strong> ha sido creado exitosamente.</p>
        <p>Ahora puedes invitar a tus compañeros e inscribirte en los torneos disponibles.</p>
    `;
    return sendEmail(captain.email, subject, html);
};

export const sendTournamentInscriptionEmail = async (teamName: string, tournamentName: string, captainEmail: string) => {
    const subject = `Inscripción recibida: ${tournamentName} 📝`;
    const html = `
        <h1>Inscripción Exitosa</h1>
        <p>El equipo <strong>${teamName}</strong> se ha inscrito correctamente en el torneo <strong>${tournamentName}</strong>.</p>
        <p>Recuerda subir el comprobante de pago para validar tu participación.</p>
    `;
    return sendEmail(captainEmail, subject, html);
};

export const sendPaymentValidationEmail = async (
    payment: { estado: string, observacion?: string | null },
    teamName: string,
    tournamentName: string,
    captainEmail: string
) => {
    const isApproved = payment.estado === 'VALIDADO';
    const subject = isApproved
        ? `¡Pago Aprobado! - ${tournamentName} ✅`
        : `Pago Rechazado - ${tournamentName} ❌`;

    const color = isApproved ? '#2ecc71' : '#e74c3c';

    const html = `
        <h1 style="color: ${color};">${isApproved ? '¡Pago Validado!' : 'Pago Rechazado'}</h1>
        <p>Tu solicitud de pago para el torneo <strong>${tournamentName}</strong> (Equipo: ${teamName}) ha sido <strong>${payment.estado}</strong>.</p>
        ${payment.observacion ? `<p><strong>Observación:</strong> ${payment.observacion}</p>` : ''}
        ${!isApproved ? '<p>Por favor, revisa la observación y vuelve a intentarlo.</p>' : '<p>¡Estás listo para jugar!</p>'}
    `;
    return sendEmail(captainEmail, subject, html);
};

export const sendVerificationCode = async (to: string, code: string, userName: string): Promise<EmailResult> => {
    const subject = '🔐 Código de Verificación MCP - UIDEportes';
    const html = `
        <h2>Hola ${userName},</h2>
        <p>Tu código de verificación para acceder al servidor MCP de Claude es:</p>
        <h1 style="background-color: #f0f0f0; padding: 10px; display: inline-block; letter-spacing: 5px;">${code}</h1>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no solicitaste este código, ignora este mensaje.</p>
        <hr>
        <p><small>UIDEportes - Sistema de Gestión Deportiva</small></p>
    `;
    return await sendEmail(to, subject, html);
};

export const sendPasswordResetCode = async (to: string, code: string): Promise<EmailResult> => {
    const subject = '🔐 Código de Recuperación - UIDEportes';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; borderRadius: 8px;">
            <h1 style="color: #1a237e; text-align: center;">Recuperación de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña en <strong>UIDEportes</strong>.</p>
            <p>Utiliza el siguiente código para completar el proceso:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #3949ab;">${code}</span>
            </div>
            <p>Este código expirará en <strong>15 minutos</strong> por seguridad.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">
                UIDEportes - Plataforma de Gestión Deportiva Universitaria
            </p>
        </div>
    `;
    return sendEmail(to, subject, html);
};

