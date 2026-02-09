import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';

/**
 * Genera un código numérico de 6 dígitos
 */
export function generateResetToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Crea un token de recuperación de contraseña para un usuario
 * @param email Email del usuario
 * @returns Token generado o null si el usuario no existe
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
    const user = await prisma.usuario.findUnique({
        where: { email }
    });

    if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return null;
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos (más seguro para códigos cortos)

    await prisma.passwordResetToken.create({
        data: {
            usuarioId: user.id,
            token,
            expiraEn: expiresAt
        }
    });

    return token;
}

/**
 * Valida un token de recuperación de contraseña
 * @param token Token a validar
 * @returns Objeto con validez y userId si es válido
 */
export async function validateResetToken(token: string): Promise<{ valid: boolean; userId?: number; message?: string }> {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
    });

    if (!resetToken) {
        return { valid: false, message: 'Token inválido' };
    }

    if (resetToken.usado) {
        return { valid: false, message: 'Token ya utilizado' };
    }

    if (new Date() > resetToken.expiraEn) {
        return { valid: false, message: 'Token expirado' };
    }

    return { valid: true, userId: resetToken.usuarioId };
}

/**
 * Marca un token como usado
 * @param token Token a marcar
 */
export async function markTokenAsUsed(token: string): Promise<void> {
    await prisma.passwordResetToken.update({
        where: { token },
        data: { usado: true }
    });
}

/**
 * Limpia tokens expirados (puede ejecutarse periódicamente)
 */
export async function cleanExpiredTokens(): Promise<number> {
    const result = await prisma.passwordResetToken.deleteMany({
        where: {
            OR: [
                { expiraEn: { lt: new Date() } },
                { usado: true }
            ]
        }
    });

    return result.count;
}
