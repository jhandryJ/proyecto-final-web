import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma.js';
import { registerUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';
import { sendWelcomeEmail, sendPasswordResetCode } from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';
import { createPasswordResetToken, validateResetToken, markTokenAsUsed } from '../../services/password-reset.service.js';

// Rate limiting: almacena intentos fallidos de login por IP
const loginAttempts = new Map<string, { count: number; blockedUntil?: Date }>();

export async function registerUserHandler(
    request: FastifyRequest<{ Body: z.infer<typeof registerUserSchema> }>,
    reply: FastifyReply
) {
    const { password, ...userData } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.usuario.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
            include: {
                carrera: {
                    include: {
                        facultad: true
                    }
                }
            }
        });

        // Send Welcome Email (async, don't await to not block)
        sendWelcomeEmail({ email: user.email, nombres: user.nombres }).catch(console.error);

        // Create In-App Notification
        createNotification(
            user.id,
            '¡Bienvenido a UIDEportes! Completa tu perfil para empezar.',
            'SUCCESS'
        ).catch(console.error);

        return reply.code(201).send({
            id: user.id,
            cedula: user.cedula,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol,
            genero: user.genero,
            createdAt: user.createdAt,
            carrera: user.carrera,
            chatBannedUntil: user.chatBannedUntil,
            chatBanReason: user.chatBanReason
        });
    } catch (e: any) {
        if (e.code === 'P2002') { // Unique constraint violation
            return reply.code(409).send({ message: 'User with this email or cedula already exists' });
        }
        request.log.error(e);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}

export async function loginUserHandler(
    request: FastifyRequest<{ Body: z.infer<typeof loginUserSchema> }>,
    reply: FastifyReply
) {
    const { email, password } = request.body;
    const clientIp = request.ip;

    // Verificar rate limiting
    const attempts = loginAttempts.get(clientIp);
    if (attempts?.blockedUntil && new Date() < attempts.blockedUntil) {
        const minutesLeft = Math.ceil((attempts.blockedUntil.getTime() - Date.now()) / 60000);
        return reply.code(429).send({
            message: `Demasiados intentos fallidos. Cuenta bloqueada temporalmente. Intente nuevamente en ${minutesLeft} minuto(s).`
        });
    }

    const user = await prisma.usuario.findUnique({
        where: { email },
        include: {
            carrera: {
                include: {
                    facultad: true
                }
            }
        }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        // Incrementar contador de intentos fallidos
        const currentAttempts = attempts?.count || 0;
        const newCount = currentAttempts + 1;

        if (newCount >= 5) {
            // Bloquear por 15 minutos
            loginAttempts.set(clientIp, {
                count: newCount,
                blockedUntil: new Date(Date.now() + 15 * 60 * 1000)
            });
            return reply.code(429).send({
                message: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.'
            });
        } else {
            loginAttempts.set(clientIp, { count: newCount });
        }

        return reply.code(401).send({ message: 'Credenciales inválidas' });
    }

    // Login exitoso: limpiar intentos fallidos y actualizar ultimoLogin
    loginAttempts.delete(clientIp);

    await prisma.usuario.update({
        where: { id: user.id },
        data: { ultimoLogin: new Date() }
    });

    const accessToken = request.server.jwt.sign({
        id: user.id,
        email: user.email,
        rol: user.rol,
    });

    return {
        accessToken,
        user: {
            id: user.id,
            cedula: user.cedula,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol,
            genero: user.genero,
            createdAt: user.createdAt,
            carrera: user.carrera,
            chatBannedUntil: user.chatBannedUntil,
            chatBanReason: user.chatBanReason
        },
    };
}

export async function deleteUserHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const adminUser = request.user as { rol: string };

    // Verify admin role (assuming middleware does it, but double check usually good or rely on route config)
    if (adminUser.rol !== 'ADMIN') {
        return reply.code(403).send({ message: 'Forbidden. Only admins can delete users.' });
    }

    try {
        await prisma.usuario.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (e: any) {
        if (e.code === 'P2025') {
            return reply.code(404).send({ message: 'User not found' });
        }
        return reply.code(500).send({ message: 'Error deleting user' });
    }
}

export async function promoteToCaptainHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = request.user as { id: number; rol: string };

    try {
        const currentUser = await prisma.usuario.findUnique({
            where: { id: user.id }
        });

        if (!currentUser) {
            return reply.code(404).send({ message: 'Usuario no encontrado' });
        }

        if (currentUser.rol === 'CAPITAN' || currentUser.rol === 'ADMIN') {
            return reply.code(400).send({ message: 'El usuario ya tiene rol de Capitán o superior' });
        }

        if (currentUser.rol !== 'ESTUDIANTE') {
            // Por si hay otros roles en el futuro, pero asumimos ESTUDIANTE es el base
        }

        // Actualizar rol
        const updatedUser = await prisma.usuario.update({
            where: { id: user.id },
            data: { rol: 'CAPITAN' }
        });

        // Generar nuevo token con el rol actualizado
        const accessToken = request.server.jwt.sign({
            id: updatedUser.id,
            email: updatedUser.email,
            rol: updatedUser.rol,
        });

        return reply.send({
            message: '¡Felicidades! Ahora eres Capitán.',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                rol: updatedUser.rol
            },
            accessToken
        });

    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al promover usuario a Capitán' });
    }
}

/**
 * Handler para solicitar recuperación de contraseña
 */
export async function forgotPasswordHandler(
    request: FastifyRequest<{ Body: z.infer<typeof forgotPasswordSchema> }>,
    reply: FastifyReply
) {
    const { email } = request.body;

    try {
        const token = await createPasswordResetToken(email);

        if (token) {
            // Enviar email con el código de recuperación
            await sendPasswordResetCode(email, token).catch(e => {
                request.log.error('Error sending reset email:', e);
            });

            request.log.info(`Password reset code for ${email} sent successfully`);
        }

        // Siempre responder con éxito para no revelar si el email existe
        return reply.send({
            message: 'Si el correo existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.'
        });

    } catch (e: any) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al procesar solicitud' });
    }
}

/**
 * Handler para resetear contraseña con token
 */
export async function resetPasswordHandler(
    request: FastifyRequest<{ Body: z.infer<typeof resetPasswordSchema> }>,
    reply: FastifyReply
) {
    const { token, newPassword } = request.body;

    try {
        const validation = await validateResetToken(token);

        if (!validation.valid || !validation.userId) {
            return reply.code(400).send({ message: validation.message || 'Token inválido' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await prisma.usuario.update({
            where: { id: validation.userId },
            data: { password: hashedPassword }
        });

        // Marcar token como usado
        await markTokenAsUsed(token);

        return reply.send({ message: 'Contraseña actualizada exitosamente' });

    } catch (e: any) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al resetear contraseña' });
    }
}
