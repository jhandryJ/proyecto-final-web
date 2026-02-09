import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prisma.js';
import { addTeamToTorneoSchema, createCampeonatoSchema, createTorneoSchema, generateDrawSchema, updateCampeonatoSchema, updateTorneoSchema } from './tournaments.schemas.js';
import { drawService } from './draw.service.js';
import { z } from 'zod';

export async function createCampeonatoHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createCampeonatoSchema> }>,
    reply: FastifyReply
) {
    const data = request.body;
    try {
        const campeonatoData: any = {
            nombre: data.nombre,
            anio: data.anio,
            fechaInicio: new Date(data.fechaInicio)
        };

        // Only add fechaFin if it's provided and valid
        if (data.fechaFin) {
            campeonatoData.fechaFin = new Date(data.fechaFin);
        }

        const campeonato = await prisma.campeonato.create({
            data: campeonatoData
        });
        return reply.code(201).send(campeonato);
    } catch (e: any) {
        console.error('Error creating championship:', e);
        return reply.code(500).send({ message: 'Error creating championship', error: e.message });
    }
}

export async function getCampeonatosHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const campeonatos = await prisma.campeonato.findMany({
            include: {
                torneos: {
                    include: {
                        equiposInscritos: {
                            include: {
                                equipo: true,
                                grupos: true
                            }
                        }
                    }
                }
            }
        });
        const formattedCampeonatos = campeonatos.map(c => {
            return {
                id: c.id,
                nombre: c.nombre,
                anio: c.anio,
                fechaInicio: c.fechaInicio.toISOString(),
                fechaFin: c.fechaFin ? c.fechaFin.toISOString() : null,
                torneos: (c.torneos || []).map(t => {
                    const tc = t as any;
                    return {
                        id: t.id,
                        campeonatoId: t.campeonatoId,
                        disciplina: t.disciplina,
                        categoria: t.categoria,
                        genero: t.genero,
                        tipoSorteo: t.tipoSorteo,
                        configuracion: t.configuracion,
                        costoInscripcion: tc.costoInscripcion ? parseFloat(tc.costoInscripcion.toString()) : 0,
                        inscripciones: (tc.equiposInscritos || []).map((ei: any) => ({
                            estado: ei.estado,
                            equipoId: ei.equipoId,
                            equipo: {
                                nombre: ei.equipo?.nombre || 'Sin nombre'
                            },
                            grupos: ei.grupos || []
                        }))
                    };
                })
            };
        });
        return reply.send(formattedCampeonatos);
    } catch (e: any) {
        console.error('Error fetching championships:', e);
        return reply.code(500).send({ message: 'Error fetching championships', error: e.message });
    }
}

export async function createTorneoHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createTorneoSchema> }>,
    reply: FastifyReply
) {
    const data = request.body;

    try {
        // Map categoria to tipoSorteo for consistency
        let tipoSorteo: string;
        switch (data.categoria) {
            case 'FASE_GRUPOS':
                tipoSorteo = 'GRUPOS';
                break;
            case 'ELIMINATORIA':
                tipoSorteo = 'BRACKET';
                break;
            case 'TODOS_CONTRA_TODOS':
                tipoSorteo = 'GRUPOS'; // Todos contra todos uses groups logic
                break;
            default:
                tipoSorteo = 'BRACKET';
        }

        request.log.info(`Creating torneo with categoria: ${data.categoria}, tipoSorteo: ${tipoSorteo}`);

        const torneo = await prisma.torneo.create({
            data: {
                ...data,
                tipoSorteo
            }
        });
        return reply.code(201).send(torneo);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error creating tournament' });
    }
}

export async function updateCampeonatoHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof updateCampeonatoSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const data = request.body;
    try {
        const updateData: any = { ...data };

        if (updateData.fechaInicio) {
            updateData.fechaInicio = new Date(updateData.fechaInicio);
        }

        if (updateData.fechaFin) {
            updateData.fechaFin = new Date(updateData.fechaFin);
        }

        const campeonato = await prisma.campeonato.update({
            where: { id: Number(id) },
            data: updateData
        });
        return reply.send(campeonato);
    } catch (e: any) {
        request.log.error(e);
        if (e.code === 'P2025') {
            return reply.code(404).send({ message: 'Championship not found' });
        }
        return reply.code(500).send({ message: 'Error updating championship', error: e.message });
    }
}

export async function updateTorneoHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof updateTorneoSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const data = request.body;

    try {
        // Map categoria to tipoSorteo if categoria is being updated
        let updateData = { ...data };
        if (data.categoria) {
            let tipoSorteo: string;
            switch (data.categoria) {
                case 'FASE_GRUPOS':
                    tipoSorteo = 'GRUPOS';
                    break;
                case 'ELIMINATORIA':
                    tipoSorteo = 'BRACKET';
                    break;
                case 'TODOS_CONTRA_TODOS':
                    tipoSorteo = 'GRUPOS';
                    break;
                default:
                    tipoSorteo = 'BRACKET';
            }
            updateData = { ...updateData, tipoSorteo } as any;
        }

        const torneo = await prisma.torneo.update({
            where: { id: Number(id) },
            data: updateData
        });
        return reply.send(torneo);
    } catch (e: any) {
        request.log.error(e);
        if (e.code === 'P2025') {
            return reply.code(404).send({ message: 'Torneo no encontrado' });
        }
        return reply.code(500).send({ message: 'Error al actualizar torneo' });
    }
}

export async function deleteCampeonatoHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    try {
        const campeonatoId = Number(id);

        // Get all tournaments in this championship
        const torneos = await prisma.torneo.findMany({
            where: { campeonatoId },
            select: { id: true }
        });

        // Delete all associated data for each tournament
        for (const torneo of torneos) {
            // 1. Delete Streaming records associated with matches
            const partidos = await prisma.partido.findMany({
                where: { torneoId: torneo.id },
                select: { id: true }
            });
            const partidoIds = partidos.map(p => p.id);

            if (partidoIds.length > 0) {
                await prisma.streaming.deleteMany({
                    where: { partidoId: { in: partidoIds } }
                });
            }

            // 2. Delete Matches
            await prisma.partido.deleteMany({
                where: { torneoId: torneo.id }
            });

            // 3. Delete Groups associated with team registrations
            const inscripciones = await prisma.equipotorneo.findMany({
                where: { torneoId: torneo.id },
                select: { id: true }
            });
            const inscripcionIds = inscripciones.map(i => i.id);

            if (inscripcionIds.length > 0) {
                await prisma.grupo.deleteMany({
                    where: { equipoTorneoId: { in: inscripcionIds } }
                });
            }

            // 4. Delete Payments associated with the tournament
            await prisma.validacionpago.deleteMany({
                where: { torneoId: torneo.id }
            });

            // 5. Delete Team Registrations
            await prisma.equipotorneo.deleteMany({
                where: { torneoId: torneo.id }
            });
        }

        // Delete all tournaments
        await prisma.torneo.deleteMany({
            where: { campeonatoId }
        });

        // Finally delete the championship
        await prisma.campeonato.delete({
            where: { id: campeonatoId }
        });

        return reply.code(204).send();
    } catch (e: any) {
        request.log.error(e);
        if (e.code === 'P2025') { // Record not found
            return reply.code(404).send({ message: 'Campeonato no encontrado' });
        }
        if (e.code === 'P2003') {
            return reply.code(409).send({
                message: 'No se puede eliminar el campeonato. Tiene datos asociados que deben eliminarse primero.'
            });
        }
        return reply.code(500).send({ message: 'Error al eliminar campeonato' });
    }
}

export async function deleteTorneoHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    try {
        // First, delete all associated records to avoid foreign key constraints
        const torneoId = Number(id);

        // 1. Delete Streaming records associated with matches
        const partidos = await prisma.partido.findMany({
            where: { torneoId },
            select: { id: true }
        });
        const partidoIds = partidos.map(p => p.id);

        if (partidoIds.length > 0) {
            await prisma.streaming.deleteMany({
                where: { partidoId: { in: partidoIds } }
            });
        }

        // 2. Delete Matches
        await prisma.partido.deleteMany({
            where: { torneoId }
        });

        // 3. Delete Groups associated with team registrations
        const inscripciones = await prisma.equipotorneo.findMany({
            where: { torneoId },
            select: { id: true }
        });
        const inscripcionIds = inscripciones.map(i => i.id);

        if (inscripcionIds.length > 0) {
            await prisma.grupo.deleteMany({
                where: { equipoTorneoId: { in: inscripcionIds } }
            });
        }

        // 4. Delete Payments associated with the tournament
        await prisma.validacionpago.deleteMany({
            where: { torneoId }
        });

        // 5. Delete Team Registrations
        await prisma.equipotorneo.deleteMany({
            where: { torneoId }
        });

        // Now delete the tournament
        await prisma.torneo.delete({
            where: { id: torneoId }
        });

        return reply.code(204).send();
    } catch (e: any) {
        request.log.error(e);
        if (e.code === 'P2025') {
            return reply.code(404).send({ message: 'Torneo no encontrado' });
        }
        if (e.code === 'P2003') {
            return reply.code(409).send({
                message: 'No se puede eliminar el torneo. Tiene datos asociados que deben eliminarse primero.'
            });
        }
        return reply.code(500).send({ message: 'Error al eliminar torneo' });
    }
}

export async function generateDrawHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof generateDrawSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { type, settings } = request.body;

    try {
        const result = await drawService.generateDraw(Number(id), type, settings);
        return reply.code(201).send(result);
    } catch (e: any) {
        request.log.error(e);
        return reply.code(400).send({ message: e.message || 'Error generating draw' });
    }
}

export async function createTeamRegistrationHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof addTeamToTorneoSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { equipoId } = request.body;
    const user = request.user as { id: number, rol: string };

    try {
        // Verify ownership/permission
        if (user.rol !== 'ADMIN') {
            const team = await prisma.equipo.findUnique({
                where: { id: equipoId }
            });

            if (!team) {
                return reply.code(404).send({ message: 'Team not found' });
            }

            if (team.capitanId !== user.id) {
                return reply.code(403).send({ message: 'Only the team captain can register the team' });
            }
        }

        // Validation: Check if team is already registered
        const existing = await prisma.equipotorneo.findUnique({
            where: {
                equipoId_torneoId: {
                    equipoId,
                    torneoId: Number(id)
                }
            }
        });

        if (existing) {
            return reply.code(409).send({
                message: 'Team already registered in this tournament',
                status: existing.estado
            });
        }

        // Check tournament cost
        const torneo = await prisma.torneo.findUnique({
            where: { id: Number(id) }
        });

        if (!torneo) {
            return reply.code(404).send({ message: 'Torneo no encontrado' });
        }

        const initialStatus = Number((torneo as any).costoInscripcion) > 0 ? 'PENDIENTE_PAGO' : 'ACEPTADO';

        const inscripcion = await prisma.equipotorneo.create({
            data: {
                equipoId,
                torneoId: Number(id),
                estado: initialStatus
            }
        });

        if (initialStatus === 'PENDIENTE_PAGO') {
            return reply.code(201).send({ ...inscripcion, message: 'Inscripción creada. Pendiente de pago.' });
        }

        return reply.code(201).send(inscripcion);
    } catch (e: any) {
        if (e.code === 'P2003') {
            return reply.code(400).send({ message: 'Invalid team or tournament ID' });
        }
        return reply.code(500).send({ message: 'Error registering team' });
    }
}

export async function promoteToKnockoutHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    try {
        const result = await drawService.generateKnockoutFromGroups(Number(id));
        return reply.code(201).send(result);
    } catch (e: any) {
        request.log.error(e);
        return reply.code(400).send({ message: e.message || 'Error promoting to knockout stage' });
    }
}
