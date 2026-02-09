import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Server } from 'socket.io'; // Import Socket.io

import fjwt from '@fastify/jwt';
import { authRoutes } from './modules/auth/auth.routes.js';
import { tournamentRoutes } from './modules/tournaments/tournaments.routes.js';
import { teamRoutes } from './modules/teams/teams.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { enrollmentRoutes } from './modules/enrollments/enrollments.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { resourceRoutes } from './modules/resources/resources.routes.js';
import { matchRoutes } from './modules/matches/matches.routes.js';
import { notificationRoutes } from './modules/notifications/notifications.routes.js';
import fastifyMultipart from '@fastify/multipart';
import { standingsRoutes } from './modules/standings/standings.routes.js';
import { streamingRoutes } from './modules/streaming/streaming.routes.js';
import { uploadRoutes } from './modules/uploads/uploads.routes.js';
import { displayBanner } from './utils/banner.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './utils/prisma.js'; // Import Prisma

// ... (imports)


const app = Fastify({
    logger: true,
});

// Setup Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register Plugins
app.register(cors, {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

app.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Configurar servicio de archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/',
});

app.register(fjwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
});

app.register(swagger, {
    openapi: {
        info: {
            title: 'UIDEportes API',
            description: 'API for UIDE Sports Management Platform',
            version: '1.0.0',
        },
        servers: [],
        tags: [
            { name: 'Auth', description: 'Authentication related endpoints' },
            { name: 'Torneos', description: 'Championship and Tournament management' },
            { name: 'Equipos', description: 'Team management' },
            { name: 'Usuarios', description: 'User management' },
            { name: 'Inscripciones', description: 'Tournament enrollment management' },
            { name: 'Pagos', description: 'Payment validation management' },
            { name: 'Recursos', description: 'Arbiter and Pitch management' },
            { name: 'Partidos', description: 'Match scheduling and results' },
            { name: 'Posiciones', description: 'Tournament standings and team statistics' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    transform: jsonSchemaTransform,
});

app.register(swaggerUI, {
    routePrefix: '/docs',
});

// Register Modules
app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/usuarios' }); // Changed prefix to match frontend expectation
app.register(tournamentRoutes, { prefix: '/api' }); // prefixes are handled inside - Kept original variable name, added comment
app.register(teamRoutes, { prefix: '/api/equipos' }); // Changed prefix and variable name to match instruction
app.register(enrollmentRoutes, { prefix: '/api' }); // Kept original
app.register(paymentRoutes, { prefix: '/api/pagos' }); // Changed prefix to match instruction
app.register(resourceRoutes, { prefix: '/api' });
app.register(matchRoutes, { prefix: '/api' }); // Kept original
app.register(standingsRoutes, { prefix: '/api' }); // Kept original
app.register(streamingRoutes, { prefix: '/api/streaming' });
app.register(uploadRoutes, { prefix: '/api' });

// Global Error Handler
app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
        reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'El cuerpo de la solicitud no es un JSON válido. Verifique la sintaxis y el cabecera Content-Type.'
        });
        return;
    }

    // Default error handling
    reply.send(error);
});

// Basic Routes
app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
});

// Start Server
const start = async () => {
    try {
        displayBanner();
        // Wait for Fastify to be ready
        await app.ready();

        // Start listening
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3000');
        console.log('Swagger docs: http://localhost:3000/docs');

        // Socket.io Setup
        const io = new Server(app.server, {
            cors: {
                origin: "*", // Allow all origins for now
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('Un usuario se ha conectado al chat:', socket.id);

            socket.on('join_room', async (data) => {
                const room = typeof data === 'string' ? data : data.room;
                const userId = typeof data === 'string' ? null : data.userId;

                socket.join(room);
                console.log(`Usuario ${socket.id} (ID: ${userId || 'Anon'}) se unió a la sala: ${room}`);

                // If a userId is provided, check proactively for bans
                if (userId) {
                    try {
                        const dbUser = await prisma.usuario.findUnique({
                            where: { id: parseInt(userId.toString()) },
                            select: { chatBannedUntil: true, chatBanReason: true }
                        });

                        if (dbUser?.chatBannedUntil && new Date(dbUser.chatBannedUntil) > new Date()) {
                            socket.emit('ban_notification', {
                                reason: dbUser.chatBanReason,
                                until: dbUser.chatBannedUntil
                            });
                        }
                    } catch (e) {
                        console.error('Error checking ban on join:', e);
                    }
                }

                // Emit user count to the room
                const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
                io.to(room).emit('update_user_count', roomSize);
            });

            socket.on('send_message', async (data) => {
                const { room, message, user, userId, avatar, userRole } = data;

                let isAdmin = userRole === 'ADMIN'; // Default to client claim for UI responsiveness
                let isBanned = false;

                // 1. Check for Ban & Verify Admin Role (slower but secure)
                if (userId) {
                    try {
                        const dbUser = await prisma.usuario.findUnique({
                            where: { id: parseInt(userId) },
                            select: { chatBannedUntil: true, chatBanReason: true, rol: true }
                        });

                        if (dbUser) {
                            // Update Admin status from DB source of truth
                            isAdmin = dbUser.rol === 'ADMIN';

                            if (dbUser.chatBannedUntil && new Date(dbUser.chatBannedUntil) > new Date()) {
                                isBanned = true;
                                socket.emit('ban_notification', {
                                    reason: dbUser.chatBanReason,
                                    until: dbUser.chatBannedUntil
                                });
                                return; // Stop processing immediately
                            }
                        }

                    } catch (e) {
                        console.error('Error checking user status:', e);
                    }
                }

                if (isBanned) return;

                // 2. Broadcast Message
                const broadcastData = {
                    user,
                    message,
                    avatar,
                    timestamp: new Date(), // ISO string conversion happens in JSON serialization usually
                    isSystem: false,
                    isAdmin: isAdmin,
                    userId: userId
                };

                io.to(room).emit('receive_message', broadcastData);

                // 3. Persist to Database (Async, non-blocking)
                if (userId) {
                    try {
                        await prisma.mensajeChat.create({
                            data: {
                                usuarioId: parseInt(userId),
                                mensaje: message,
                                sala: room || 'general',
                            }
                        });
                    } catch (e) {
                        console.error('Error saving chat message to DB:', e);
                    }
                }
            });

            socket.on('like_stream', async (data) => {
                const { streamId } = data;
                if (!streamId) return;

                try {
                    // Update DB (Atomic increment)
                    const updatedStream = await (prisma.streaming as any).update({
                        where: { id: parseInt(streamId.toString()) },
                        data: {
                            likes: {
                                increment: 1
                            }
                        },
                        select: { id: true, likes: true }
                    });

                    // Broadcast to the room (and everyone else interested)
                    const room = `stream-${streamId}`;
                    io.emit('stream_liked', {
                        streamId: updatedStream.id.toString(),
                        likes: updatedStream.likes
                    });

                } catch (e) {
                    console.error('[LIKE ERROR]', e);
                }
            });

            socket.on('ban_user', async (data) => {
                const { adminId, targetUserId, durationMinutes, reason } = data;
                console.log(`[BAN ATTEMPT] Admin: ${adminId}, Target: ${targetUserId}, Duration: ${durationMinutes}, Reason: ${reason}`);

                if (!adminId || !targetUserId) {
                    console.error('[BAN ERROR] Missing adminId or targetUserId');
                    return;
                }

                const adminIdInt = parseInt(adminId as string);
                const targetIdInt = parseInt(targetUserId as string);

                if (isNaN(adminIdInt) || isNaN(targetIdInt)) {
                    console.error(`[BAN ERROR] Invalid IDs. Admin: ${adminId} -> ${adminIdInt}, Target: ${targetUserId} -> ${targetIdInt}`);
                    return;
                }

                try {
                    // Verify Admin
                    const admin = await prisma.usuario.findUnique({
                        where: { id: adminIdInt }
                    });

                    if (admin?.rol !== 'ADMIN') {
                        console.error(`[BAN ERROR] User ${adminId} is not an ADMIN. Role: ${admin?.rol}`);
                        return;
                    }

                    const bannedUntil = new Date();
                    bannedUntil.setMinutes(bannedUntil.getMinutes() + durationMinutes);

                    // Update User
                    const updatedUser = await prisma.usuario.update({
                        where: { id: targetIdInt },
                        data: {
                            chatBannedUntil: bannedUntil,
                            chatBanReason: reason
                        }
                    });

                    console.log(`[BAN SUCCESS] User ${updatedUser.email} (ID: ${targetUserId}) banned until ${bannedUntil}`);

                    // Broadcast ban event to all clients so the specific user can be blocked
                    io.emit('user_banned', {
                        userId: targetUserId.toString(), // Ensure it's a string for client comparison
                        reason,
                        until: bannedUntil.toISOString() // Send as string to avoid serialization issues
                    });

                } catch (e) {
                    console.error('[BAN EXCEPTION]', e);
                }
            });

            socket.on('clear_chat', async (data) => {
                const { adminId, room } = data;
                console.log(`[CLEAR CHAT ATTEMPT] Admin: ${adminId}, Room: ${room}`);

                if (!adminId) return;

                try {
                    const admin = await prisma.usuario.findUnique({
                        where: { id: parseInt(adminId.toString()) }
                    });

                    if (admin?.rol !== 'ADMIN') {
                        console.error(`[CLEAR CHAT ERROR] User ${adminId} is not an ADMIN.`);
                        return;
                    }

                    // Delete messages
                    await (prisma as any).mensajeChat.deleteMany({
                        where: { sala: room || 'general' }
                    });

                    console.log(`[CLEAR CHAT SUCCESS] Room: ${room}`);

                    // Notify clients
                    io.to(room || 'general').emit('chat_cleared');

                } catch (e) {
                    console.error('[CLEAR CHAT EXCEPTION]', e);
                }
            });

            socket.on('disconnect', () => {
                console.log('Usuario desconectado:', socket.id);
                // We need to find which room the user was in to update the count.
                // Since socket.rooms is empty after disconnect, we might need a mapping or just rely on the client re-fetching or broadcasting to all rooms (inefficient).
                // A better approach for this simple app might be to just broadcast to all rooms or rely on periodic updates? 
                // Alternatively, since we can't easily know the room after disconnect without tracking it ourselves:
                // Let's implement a simple tracking map for this demo.
            });

            // Simpler approach for "disconnect" affecting counts:
            // The 'disconnecting' event gives us access to socket.rooms BEFORE they leave.
            socket.on('disconnecting', () => {
                for (const room of socket.rooms) {
                    if (room !== socket.id) {
                        // The socket is still in the room, so size includes them. 
                        // After this event, they leave. So count - 1.
                        const roomSize = (io.sockets.adapter.rooms.get(room)?.size || 0) - 1;
                        io.to(room).emit('update_user_count', roomSize);
                    }
                }
            });
        });

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
