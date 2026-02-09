import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { createTeamSchema, updateTeamSchema } from './teams.schemas.js';
import { sendTeamCreationEmail } from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';


export async function createTeamHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createTeamSchema> }>,
    reply: FastifyReply
) {
    const { nombre, logoUrl, facultad, disciplina, capitanId, codigoAcceso } = request.body;
    const user = request.user as { id: number; rol: string };

    try {
        // Determine the captain ID
        let finalCapitanId = capitanId || user.id;

        // If user is not ADMIN, enforce restrictions
        if (user.rol !== 'ADMIN') {
            // Non-admins can only create one team where they are captain
            if (capitanId && capitanId !== user.id) {
                return reply.code(403).send({ message: 'Only admins can assign other users as captains' });
            }

            // Check if user is already a captain
            const existingTeam = await prisma.equipo.findFirst({
                where: { capitanId: user.id }
            });

            if (existingTeam) {
                return reply.code(409).send({ message: 'User is already a captain of a team' });
            }

            finalCapitanId = user.id;
        }

        // Validate that the captain user exists
        const capitanUser = await prisma.usuario.findUnique({
            where: { id: finalCapitanId }
        });

        if (!capitanUser) {
            return reply.code(400).send({
                message: `Captain user with ID ${finalCapitanId} does not exist. Please ensure you are logged in with a valid account.`
            });
        }

        const team = await prisma.equipo.create({
            data: {
                nombre,
                logoUrl,
                facultad,
                disciplina,
                capitanId: finalCapitanId,
                codigoAcceso
            }
        });

        // Add the captain as a member of the team
        await prisma.miembroequipo.create({
            data: {
                equipoId: team.id,
                usuarioId: finalCapitanId
            }
        });

        // Send Email and Notification
        if (capitanUser) {
            sendTeamCreationEmail(
                { nombre: team.nombre },
                { email: capitanUser.email, nombres: capitanUser.nombres }
            ).catch(console.error);

            createNotification(
                finalCapitanId,
                `Has creado el equipo "${team.nombre}" exitosamente.`,
                'SUCCESS'
            ).catch(console.error);
        }

        return reply.code(201).send(team);
    } catch (e: any) {
        request.log.error(e);
        if (e.code === 'P2002') {
            return reply.code(409).send({ message: 'Team name already exists or captain conflict' });
        }
        return reply.code(500).send({ message: 'Error creating team', error: e.message });
    }
}

export async function getTeamsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    // Si el usuario está autenticado, aplicar filtros RLS
    if (request.user) {
        const user = request.user as { id: number; rol: any };
        const { getTeamFilter } = await import('../../utils/rls-helpers.js');

        const teams = await prisma.equipo.findMany({
            where: getTeamFilter(user.id, user.rol),
            include: {
                capitan: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        email: true,
                        carrera: {
                            select: {
                                nombre: true,
                                facultad: {
                                    select: { nombre: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        return reply.send(teams);
    }

    // Si no está autenticado, mostrar todos (ruta pública)
    const teams = await prisma.equipo.findMany({
        include: {
            capitan: {
                select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                    email: true,
                    carrera: {
                        select: {
                            nombre: true,
                            facultad: {
                                select: { nombre: true }
                            }
                        }
                    }
                }
            }
        }
    });
    return reply.send(teams);
}

export async function getTeamHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    // Si el usuario está autenticado, validar acceso con RLS
    if (request.user) {
        const user = request.user as { id: number; rol: any };
        const { canAccessTeam } = await import('../../utils/rls-helpers.js');

        const hasAccess = await canAccessTeam(user.id, user.rol, Number(id), prisma);
        if (!hasAccess) {
            return reply.code(403).send({
                message: 'No tienes permiso para ver este equipo'
            });
        }
    }

    const team = await prisma.equipo.findUnique({
        where: { id: Number(id) },
        include: {
            capitan: {
                select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                    email: true,
                    carrera: {
                        select: {
                            nombre: true,
                            facultad: {
                                select: { nombre: true }
                            }
                        }
                    }
                }
            },
            miembros: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            email: true,
                            cedula: true,
                            rol: true,
                            carrera: {
                                select: {
                                    nombre: true,
                                    facultad: {
                                        select: { nombre: true }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!team) {
        return reply.code(404).send({ message: 'Team not found' });
    }

    return reply.send(team);
}

export async function updateTeamHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof updateTeamSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const user = request.user as { id: number, rol: string };

    try {
        const team = await prisma.equipo.findUnique({ where: { id: Number(id) } });
        if (!team) return reply.code(404).send({ message: 'Team not found' });

        // Authorization: Only Captain or Admin
        if (team.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Forbidden' });
        }

        const updatedTeam = await prisma.equipo.update({
            where: { id: Number(id) },
            data: request.body
        });

        return reply.send(updatedTeam);
    } catch (e) {
        return reply.code(500).send({ message: 'Error updating team' });
    }
}

export async function getUserTeamsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = request.user as { id: number };

    try {
        const teams = await prisma.equipo.findMany({
            where: {
                OR: [
                    { capitanId: user.id },
                    { miembros: { some: { usuarioId: user.id } } }
                ]
            },
            include: {
                capitan: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        email: true,
                        carrera: {
                            select: {
                                nombre: true,
                                facultad: {
                                    select: { nombre: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { miembros: true }
                }
            }
        });
        return reply.send(teams);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error fetching user teams' });
    }
}

export async function getAvailableTeamsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const teams = await prisma.equipo.findMany({
            where: {
                torneos: {
                    none: {}
                }
            },
            include: {
                capitan: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        email: true,
                        carrera: {
                            select: {
                                nombre: true,
                                facultad: {
                                    select: { nombre: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { miembros: true }
                }
            }
        });
        return reply.send(teams);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error fetching available teams' });
    }
}

export async function joinTeamHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: { codigoAcceso?: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { codigoAcceso } = request.body;
    const user = request.user as { id: number };

    try {
        const teamId = parseInt(id);

        const team = await prisma.equipo.findUnique({ where: { id: teamId } });
        if (!team) return reply.code(404).send({ message: 'Team not found' });

        // Verify Access Code
        if (team.codigoAcceso && team.codigoAcceso !== codigoAcceso) {
            return reply.code(403).send({ message: 'Código de acceso incorrecto' });
        }

        const existingMember = await prisma.miembroequipo.findFirst({
            where: {
                equipoId: teamId,
                usuarioId: user.id
            }
        });

        if (existingMember || team.capitanId === user.id) {
            return reply.code(409).send({ message: 'Already a member of this team' });
        }

        await prisma.miembroequipo.create({
            data: {
                equipoId: teamId,
                usuarioId: user.id
            }
        });

        return reply.code(200).send({ message: 'Joined team successfully' });
    } catch (e) {
        return reply.code(500).send({ message: 'Error joining team' });
    }
}

export async function deleteTeamHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const user = request.user as { id: number, rol: string };

    try {
        const teamId = Number(id);
        const team = await prisma.equipo.findUnique({ where: { id: teamId } });

        if (!team) {
            return reply.code(404).send({ message: 'Team not found' });
        }

        // Authorization: Only Captain or Admin can delete
        if (team.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Forbidden. Only the captain or admin can delete the team.' });
        }

        // Transaction to delete all related data
        await prisma.$transaction(async (tx) => {
            // 1. Delete Payment Validations
            await tx.validacionpago.deleteMany({
                where: { equipoId: teamId }
            });

            // 2. Delete Matches (Local and Visitor)
            await tx.partido.deleteMany({
                where: {
                    OR: [
                        { equipoLocalId: teamId },
                        { equipoVisitanteId: teamId }
                    ]
                }
            });

            // 3. Delete Tournament Registrations
            await tx.equipotorneo.deleteMany({
                where: { equipoId: teamId }
            });

            // 4. Delete Team Members
            await tx.miembroequipo.deleteMany({
                where: { equipoId: teamId }
            });

            // 5. Delete the Team
            await tx.equipo.delete({
                where: { id: teamId }
            });
        });

        return reply.code(204).send();
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error deleting team' });
    }
}

export async function leaveTeamHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const user = request.user as { id: number };

    try {
        const teamId = Number(id);
        const team = await prisma.equipo.findUnique({ where: { id: teamId } });

        if (!team) {
            return reply.code(404).send({ message: 'Team not found' });
        }

        // Prevent captain from leaving
        if (team.capitanId === user.id) {
            return reply.code(403).send({
                message: 'No puedes salir del equipo siendo el Capitán. Debes eliminar el equipo o transferir el liderazgo (función futura).'
            });
        }

        // Check if user is a member
        const member = await prisma.miembroequipo.findFirst({
            where: {
                equipoId: teamId,
                usuarioId: user.id
            }
        });

        if (!member) {
            return reply.code(404).send({ message: 'No eres miembro de este equipo' });
        }

        // Remove member
        await prisma.miembroequipo.delete({
            where: {
                id: member.id
            }
        });

        return reply.code(200).send({ message: 'Has salido del equipo exitosamente' });
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al salir del equipo' });
    }
}
