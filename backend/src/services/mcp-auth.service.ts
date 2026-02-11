import { prisma } from '../utils/prisma.js';
import { generateVerificationCode, getExpirationDate, isCodeExpired } from '../utils/verification-code.js';
import { sendVerificationCode } from './email.service.js';

/**
 * Crea y envía un código de verificación al usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<{success: boolean, email: string, expiresAt: Date}>}
 */
export async function createAndSendVerificationCode(userId: number) {
    // Obtener datos del usuario
    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { email: true, nombres: true, apellidos: true }
    });

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    // Generar código
    const code = generateVerificationCode();
    const expirationDate = getExpirationDate();

    // Guardar en base de datos
    await prisma.codigoVerificacionMCP.create({
        data: {
            usuarioId: userId,
            codigo: code,
            expiraEn: expirationDate,
        }
    });

    // Enviar correo
    const userName = `${user.nombres} ${user.apellidos}`;
    const result = await sendVerificationCode(user.email, code, userName);

    return {
        success: result.success,
        email: user.email,
        expiresAt: expirationDate
    };
}

/**
 * Verifica un código de verificación
 * @param {number} userId - ID del usuario
 * @param {string} code - Código a verificar
 * @returns {Promise<boolean>} true si el código es válido, false en caso contrario
 */
export async function verifyCode(userId: number, code: string): Promise<boolean> {
    const verification = await prisma.codigoVerificacionMCP.findFirst({
        where: {
            usuarioId: userId,
            codigo: code,
            verificado: false
        },
        orderBy: {
            creadoEn: 'desc'
        }
    });

    if (!verification) {
        return false;
    }

    // Verificar expiración
    if (isCodeExpired(verification.expiraEn)) {
        return false;
    }

    // Marcar como verificado
    await prisma.codigoVerificacionMCP.update({
        where: { id: verification.id },
        data: { verificado: true }
    });

    return true;
}

/**
 * Limpia códigos expirados (tarea de mantenimiento)
 */
export async function cleanupExpiredCodes() {
    const now = new Date();
    const result = await prisma.codigoVerificacionMCP.deleteMany({
        where: {
            expiraEn: { lt: now }
        }
    });

    console.log(`[MCP Auth] Limpiados ${result.count} códigos expirados`);
    return result.count;
}
