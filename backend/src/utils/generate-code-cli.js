import { PrismaClient } from '@prisma/client';
import { generateVerificationCode, getExpirationDate } from './verification-code.js';
import { sendVerificationCode } from '../services/email.service.js';

const prisma = new PrismaClient();

/**
 * Genera un código de verificación para un usuario
 * @param {number} userId - ID del usuario
 */
export async function generateCode(userId) {
    try {
        // Obtener datos del usuario
        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { email: true, nombres: true, apellidos: true }
        });

        if (!user) {
            console.error('❌ Usuario no encontrado');
            await prisma.$disconnect();
            process.exit(1);
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

        if (!result.success) {
            console.error('❌ Error al enviar el correo');
            await prisma.$disconnect();
            process.exit(1);
        }

        // Formato: SUCCESS:codigo:email:expiration
        console.log(`SUCCESS:${code}:${user.email}:${expirationDate.toISOString()}`);

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Si se ejecuta directamente desde línea de comandos
if (import.meta.url === `file://${process.argv[1]}`) {
    const userId = parseInt(process.argv[2]);
    if (isNaN(userId)) {
        console.error('❌ ID de usuario inválido');
        process.exit(1);
    }
    generateCode(userId);
}
