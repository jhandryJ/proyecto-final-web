import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prisma.js';
import { createTeamSchema, updateTeamSchema } from './teams.schemas.js';
import { z } from 'zod';

// Controller for Team operations
export async function createTeamHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createTeamSchema> }>,
    reply: FastifyReply
) {
    const { nombre, logoUrl, facultad, capitanId, miembros } = request.body;
    const user = request.user as { id: number, rol: string };

    // Determine Captain
    let finalCapitanId = user.id;
    if (capitanId && user.rol === 'ADMIN') {
        finalCapitanId = capitanId;
    }

    try {
        // Check if chosen captain is already a captain
        const existingTeam = await prisma.equipo.findUnique({
            where: { capitanId: finalCapitanId }
        });

        if (existingTeam) {
            return reply.code(409).send({ message: 'Selected user is already a captain of a team' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const team = await tx.equipo.create({
                data: {
                    nombre,
                    logoUrl,
                    facultad,
                    capitanId: finalCapitanId
                }
            });

            // Add Captain as member
            await tx.miembroEquipo.create({
                data: {
                    equipoId: team.id,
                    usuarioId: finalCapitanId
                }
            });

            // Add other members if provided
            if (miembros && miembros.length > 0) {
                // Filter out captain if accidentally included
                const membersToAdd = miembros.filter((m: any) => m.usuarioId !== finalCapitanId);

                if (membersToAdd.length > 0) {
                    await tx.miembroEquipo.createMany({
                        data: membersToAdd.map((m: any) => ({
                            equipoId: team.id,
                            usuarioId: m.usuarioId,
                            dorsal: m.dorsal,
                            posicion: m.posicion
                        })),
                        skipDuplicates: true
                    });
                }
            }

            return team;
        });

        return reply.code(201).send(result);
    } catch (e: any) {
        console.error('Error in createTeamHandler:', e);
        if (e.code === 'P2002') {
            return reply.code(409).send({ message: 'Team name conflict or Captain restriction' });
        }
        return reply.code(500).send({ message: `Error creating team: ${e.message || e}` });
    }
}

export async function getTeamsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const teams = await prisma.equipo.findMany({
        include: {
            capitan: {
                select: { id: true, nombres: true, email: true }
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
    const team = await prisma.equipo.findUnique({
        where: { id: Number(id) },
        include: {
            capitan: {
                select: { id: true, nombres: true, email: true }
            },
            miembros: {
                include: {
                    usuario: {
                        select: { id: true, nombres: true, email: true }
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
    const { nombre, logoUrl, facultad, capitanId, miembros } = request.body;
    const user = request.user as { id: number, rol: string };

    try {
        const teamId = Number(id);
        const existingTeam = await prisma.equipo.findUnique({ where: { id: teamId } });
        if (!existingTeam) return reply.code(404).send({ message: 'Team not found' });

        // Authorization: Only Captain or Admin
        if (existingTeam.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Forbidden' });
        }

        // Logic to determine new Captain ID (if provided)
        let newCapitanId = existingTeam.capitanId;
        if (capitanId) {
            // Check uniqueness if captain is changing
            if (capitanId !== existingTeam.capitanId) {
                const captainExists = await prisma.equipo.findUnique({ where: { capitanId } });
                if (captainExists) {
                    return reply.code(409).send({ message: 'Selected user is already a captain of another team' });
                }
                newCapitanId = capitanId;
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update scalar fields
            const updatedTeam = await tx.equipo.update({
                where: { id: teamId },
                data: {
                    nombre,
                    logoUrl,
                    facultad,
                    capitanId: newCapitanId // Update captain if changed
                }
            });

            // 2. Handle Members Update
            // Only update members if 'miembros' array is explicitly provided
            if (miembros) {
                // Ensure the captain is included in the members list
                // Mix existing members (objects) with captain (ID). 
                // Strategy: Filter out any existing entry for captain, then add captain object.
                const membersWithoutCaptain = miembros.filter((m: any) => m.usuarioId !== newCapitanId);

                // Prepare data for creation
                const membersData = membersWithoutCaptain.map((m: any) => ({
                    equipoId: teamId,
                    usuarioId: m.usuarioId,
                    dorsal: m.dorsal,
                    posicion: m.posicion
                }));

                // Add captain
                membersData.push({
                    equipoId: teamId,
                    usuarioId: newCapitanId,
                    dorsal: undefined, // Captain might not have dorsal/pos in this payload context if not explicitly set
                    posicion: 'Capitán'
                });

                // Option A: Wipe and recreate (easiest for full sync)
                await tx.miembroEquipo.deleteMany({
                    where: { equipoId: teamId }
                });

                await tx.miembroEquipo.createMany({
                    data: membersData,
                    skipDuplicates: true
                });
            } else if (capitanId && capitanId !== existingTeam.capitanId) {
                // If captain changed but members list wasn't provided, 
                // just ensure the NEW captain is added as a member.
                await tx.miembroEquipo.upsert({
                    where: { equipoId_usuarioId: { equipoId: teamId, usuarioId: newCapitanId } },
                    create: { equipoId: teamId, usuarioId: newCapitanId },
                    update: {}
                });
            }

            return updatedTeam;
        });

        return reply.send(result);
    } catch (e) {
        console.error(e);
        return reply.code(500).send({ message: 'Error updating team' });
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
        const existingTeam = await prisma.equipo.findUnique({ where: { id: teamId } });

        if (!existingTeam) {
            return reply.code(404).send({ message: 'Team not found' });
        }

        if (user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Forbidden: Only admins can delete teams' });
        }

        await prisma.$transaction(async (tx) => {
            // Delete dependent records first (since no Cascade in schema)
            await tx.miembroEquipo.deleteMany({ where: { equipoId: teamId } });
            // Also need to handle payments/validations if any exist for this team
            await tx.validacionPago.deleteMany({ where: { equipoId: teamId } });
            // And inscripciones to tournaments
            await tx.equipoTorneo.deleteMany({ where: { equipoId: teamId } });

            await tx.equipo.delete({ where: { id: teamId } });
        });

        return reply.code(200).send({ message: 'Team deleted successfully' });
    } catch (e) {
        console.error(e);
        return reply.code(500).send({ message: 'Error deleting team' });
    }
}
