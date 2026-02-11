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
    const { nombre, logoUrl, facultad, disciplina, capitanId, codigoAcceso, genero } = request.body;
    const user = request.user as { id: number; rol: string };

    try {
        // Determinar el ID del capitán
        let finalCapitanId = capitanId || user.id;

        // Si el usuario no es ADMIN, aplicar restricciones
        if (user.rol !== 'ADMIN') {
            // Los no-admins solo pueden crear un equipo donde ellos sean el capitán
            if (capitanId && capitanId !== user.id) {
                return reply.code(403).send({ message: 'Solo los administradores pueden asignar otros usuarios como capitanes' });
            }

            // Verificar si el usuario ya es capitán
            const existingTeam = await prisma.equipo.findFirst({
                where: { capitanId: user.id }
            });

            if (existingTeam) {
                return reply.code(409).send({ message: 'El usuario ya es capitán de un equipo' });
            }

            finalCapitanId = user.id;
        }

        // Validar que el usuario capitán existe
        const capitanUser = await prisma.usuario.findUnique({
            where: { id: finalCapitanId }
        });

        if (!capitanUser) {
            return reply.code(400).send({
                message: `El usuario capitán con ID ${finalCapitanId} no existe. Por favor asegúrate de estar autenticado con una cuenta válida.`
            });
        }

        const team = await prisma.equipo.create({
            data: {
                nombre,
                logoUrl,
                facultad,
                disciplina,
                genero,
                capitanId: finalCapitanId,
                codigoAcceso
            }
        });

        // Agregar al capitán como miembro del equipo
        await prisma.miembroequipo.create({
            data: {
                equipoId: team.id,
                usuarioId: finalCapitanId
            }
        });

        // Enviar Email y Notificación
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
            return reply.code(409).send({ message: 'El nombre del equipo ya existe o conflicto con el capitán' });
        }
        return reply.code(500).send({ message: 'Error al crear equipo', error: e.message });
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
        return reply.code(404).send({ message: 'Equipo no encontrado' });
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
        if (!team) return reply.code(404).send({ message: 'Equipo no encontrado' });

        // Autorización: Solo Capitán o Admin
        if (team.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Prohibido' });
        }

        const updatedTeam = await prisma.equipo.update({
            where: { id: Number(id) },
            data: {
                nombre: request.body.nombre,
                logoUrl: request.body.logoUrl,
                facultad: request.body.facultad,
                disciplina: request.body.disciplina,
                genero: request.body.genero,
                capitanId: request.body.capitanId,
                codigoAcceso: request.body.codigoAcceso
            }
        });

        return reply.send(updatedTeam);
    } catch (e: any) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al actualizar equipo', error: e.message });
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
        return reply.code(500).send({ message: 'Error al obtener equipos del usuario' });
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
        return reply.code(500).send({ message: 'Error al obtener equipos disponibles' });
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
        if (!team) return reply.code(404).send({ message: 'Equipo no encontrado' });

        // Verificar Código de Acceso
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
            return reply.code(409).send({ message: 'Ya eres miembro de este equipo' });
        }

        await prisma.miembroequipo.create({
            data: {
                equipoId: teamId,
                usuarioId: user.id
            }

        });

        // Notificar al Capitán
        const { createNotification } = await import('../../services/notification.service.js');
        const newMember = await prisma.usuario.findUnique({ where: { id: user.id }, select: { nombres: true, apellidos: true } });
        const memberName = newMember ? `${newMember.nombres} ${newMember.apellidos}` : 'Un usuario';

        await createNotification(
            team.capitanId,
            `${memberName} se ha unido a tu equipo "${team.nombre}".`,
            'INFO'
        );

        return reply.code(200).send({ message: 'Te has unido al equipo exitosamente' });
    } catch (e) {
        return reply.code(500).send({ message: 'Error al unirse al equipo' });
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
            return reply.code(404).send({ message: 'Equipo no encontrado' });
        }

        // Autorización: Solo el Capitán o Admin pueden eliminar
        if (team.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Prohibido. Solo el capitán o un administrador pueden eliminar el equipo.' });
        }

        // Transacción para eliminar todos los datos relacionados
        await prisma.$transaction(async (tx) => {
            // 1. Eliminar Validaciones de Pago
            await tx.validacionpago.deleteMany({
                where: { equipoId: teamId }
            });

            // 2. Eliminar Partidos (Local y Visitante)
            await tx.partido.deleteMany({
                where: {
                    OR: [
                        { equipoLocalId: teamId },
                        { equipoVisitanteId: teamId }
                    ]
                }
            });

            // 3. Eliminar Inscripciones a Torneos
            await tx.equipotorneo.deleteMany({
                where: { equipoId: teamId }
            });

            // 4. Eliminar Miembros del Equipo
            await tx.miembroequipo.deleteMany({
                where: { equipoId: teamId }
            });

            // 5. Eliminar el Equipo
            await tx.equipo.delete({
                where: { id: teamId }
            });
        });

        return reply.code(204).send();
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error al eliminar equipo' });
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
            return reply.code(404).send({ message: 'Equipo no encontrado' });
        }

        // Prevenir que el capitán salga del equipo
        if (team.capitanId === user.id) {
            return reply.code(403).send({
                message: 'No puedes salir del equipo siendo el Capitán. Debes eliminar el equipo o transferir el liderazgo (función futura).'
            });
        }

        // Verificar si el usuario es miembro
        const member = await prisma.miembroequipo.findFirst({
            where: {
                equipoId: teamId,
                usuarioId: user.id
            }
        });

        if (!member) {
            return reply.code(404).send({ message: 'No eres miembro de este equipo' });
        }

        // Eliminar miembro
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
