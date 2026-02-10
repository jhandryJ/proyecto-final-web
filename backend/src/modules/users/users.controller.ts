import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prisma.js';

export async function getUsersHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const users = await prisma.usuario.findMany({
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                email: true,
                rol: true,
                createdAt: true,
                carrera: {
                    select: {
                        id: true,
                        nombre: true,
                        facultad: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                nombres: 'asc'
            }
        });

        const formattedUsers = users.map(user => ({
            ...user,
            facultad: user.carrera?.facultad?.nombre || null,
            carrera: user.carrera?.nombre || null
        }));

        return reply.send(formattedUsers);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error fetching users' });
    }
}

export async function getUserHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    try {
        const user = await prisma.usuario.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                email: true,
                rol: true,
                createdAt: true,
                carrera: {
                    select: {
                        id: true,
                        nombre: true,
                        facultad: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return reply.code(404).send({ message: 'User not found' });
        }

        const formattedUser = {
            ...user,
            facultad: user.carrera?.facultad?.nombre || null,
            carrera: user.carrera?.nombre || null
        };

        return reply.send(formattedUser);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error fetching user' });
    }
}
