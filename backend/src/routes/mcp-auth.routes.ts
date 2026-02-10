import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateVerificationCode, getExpirationDate, isCodeExpired } from '../utils/verification-code.js';
import { sendVerificationCode } from '../services/email.service.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Almacenamiento temporal de tokens de sesión (en producción usar Redis)
const sessionTokens = new Map<string, { userId: number; expiresAt: Date }>();

/**
 * Genera un token de sesión único
 */
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Rutas para autenticación MCP
 */
export async function mcpAuthRoutes(fastify: FastifyInstance) {

    /**
     * POST /mcp/generate-code
     * Genera y envía un código de verificación
     */
    fastify.post('/mcp/generate-code', async (request, reply) => {
        try {
            const { userId } = request.body as { userId: number };

            if (!userId) {
                return reply.status(400).send({
                    success: false,
                    error: 'userId es requerido'
                });
            }

            // Obtener datos del usuario
            const user = await prisma.usuario.findUnique({
                where: { id: userId },
                select: { email: true, nombres: true, apellidos: true }
            });

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'Usuario no encontrado'
                });
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
                return reply.status(500).send({
                    success: false,
                    error: 'Error al enviar el correo'
                });
            }

            return reply.send({
                success: true,
                email: user.email,
                expiresAt: expirationDate
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al generar código:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /mcp/verify-code
     * Verifica un código y crea un token de sesión
     */
    fastify.post('/mcp/verify-code', async (request, reply) => {
        try {
            const { userId, code } = request.body as { userId: number; code: string };

            if (!userId || !code) {
                return reply.status(400).send({
                    success: false,
                    error: 'userId y code son requeridos'
                });
            }

            // Buscar el código más reciente no verificado
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
                return reply.status(400).send({
                    success: false,
                    error: 'Código inválido'
                });
            }

            // Verificar expiración
            if (isCodeExpired(verification.expiraEn)) {
                return reply.status(400).send({
                    success: false,
                    error: 'Código expirado'
                });
            }

            // Marcar como verificado
            await prisma.codigoVerificacionMCP.update({
                where: { id: verification.id },
                data: { verificado: true }
            });

            // Crear token de sesión (válido por 5 minutos)
            const sessionToken = generateSessionToken();
            const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

            sessionTokens.set(sessionToken, {
                userId: userId,
                expiresAt: tokenExpiresAt
            });

            console.log(`[MCP Auth API] Token de sesión creado para usuario ${userId}: ${sessionToken.substring(0, 8)}...`);

            return reply.send({
                success: true,
                sessionToken: sessionToken,
                expiresAt: tokenExpiresAt
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al verificar código:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /mcp/check-session/:token
     * Verifica si un token de sesión es válido
     */
    fastify.get('/mcp/check-session/:token', async (request, reply) => {
        try {
            const { token } = request.params as { token: string };

            const session = sessionTokens.get(token);

            if (!session) {
                return reply.send({
                    valid: false,
                    error: 'Token no encontrado'
                });
            }

            // Verificar expiración
            if (new Date() > session.expiresAt) {
                sessionTokens.delete(token);
                return reply.send({
                    valid: false,
                    error: 'Token expirado'
                });
            }

            return reply.send({
                valid: true,
                userId: session.userId,
                expiresAt: session.expiresAt
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al verificar sesión:', error);
            return reply.status(500).send({
                valid: false,
                error: error.message
            });
        }
    });

    /**
     * DELETE /mcp/invalidate-session/:token
     * Invalida un token de sesión
     */
    fastify.delete('/mcp/invalidate-session/:token', async (request, reply) => {
        try {
            const { token } = request.params as { token: string };

            const deleted = sessionTokens.delete(token);

            return reply.send({
                success: deleted,
                message: deleted ? 'Token invalidado' : 'Token no encontrado'
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al invalidar sesión:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /mcp/save-token-for-script
     * Guarda el token en un almacenamiento temporal para que el script PowerShell pueda acceder
     */
    fastify.post('/mcp/save-token-for-script', async (request, reply) => {
        try {
            const { userId, sessionToken } = request.body as { userId: number; sessionToken: string };

            // Guardar en un Map temporal con el userId como clave
            const pendingTokens = (global as any).pendingTokens || new Map();
            (global as any).pendingTokens = pendingTokens;

            pendingTokens.set(userId, {
                token: sessionToken,
                timestamp: new Date()
            });

            console.log(`[MCP Auth API] Token guardado para usuario ${userId}`);

            return reply.send({
                success: true
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al guardar token:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /mcp/get-pending-token/:userId
     * Obtiene el token pendiente para un usuario (usado por PowerShell)
     */
    fastify.get('/mcp/get-pending-token/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const pendingTokens = (global as any).pendingTokens || new Map();

            const tokenData = pendingTokens.get(parseInt(userId));

            if (!tokenData) {
                return reply.send({
                    success: false,
                    error: 'No hay token pendiente'
                });
            }

            // Verificar que no sea muy antiguo (máximo 2 minutos)
            const age = Date.now() - tokenData.timestamp.getTime();
            if (age > 2 * 60 * 1000) {
                pendingTokens.delete(parseInt(userId));
                return reply.send({
                    success: false,
                    error: 'Token expirado'
                });
            }

            // Eliminar el token después de recuperarlo
            pendingTokens.delete(parseInt(userId));

            return reply.send({
                success: true,
                sessionToken: tokenData.token
            });

        } catch (error: any) {
            console.error('[MCP Auth API] Error al obtener token pendiente:', error);
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    });
}
