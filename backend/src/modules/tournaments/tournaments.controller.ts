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
    console.log('Cuerpo de Creación de Campeonato Recibido:', JSON.stringify(data, null, 2));
    try {
        const result = await prisma.$transaction(async (tx) => {
            const campeonatoData: any = {
                nombre: data.nombre,
                anio: data.anio,
                fechaInicio: new Date(data.fechaInicio)
            };

            // Solo agregar fechaFin si se proporciona y es válida
            if (data.fechaFin) {
                campeonatoData.fechaFin = new Date(data.fechaFin);
            }

            const campeonato = await tx.campeonato.create({
                data: campeonatoData
            });

            // Si se proporcionan torneos, crearlos
            if (data.torneos && data.torneos.length > 0) {
                for (const torneo of data.torneos) {
                    // Mapear categoria a tipoSorteo
                    let tipoSorteo: string;
                    switch (torneo.categoria) {
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

                    await tx.torneo.create({
                        data: {
                            campeonatoId: campeonato.id,
                            disciplina: torneo.disciplina,
                            categoria: torneo.categoria,
                            genero: torneo.genero,
                            costoInscripcion: torneo.costoInscripcion,
                            tipoSorteo
                        }
                    });
                }
            }

            return campeonato;
        });

        // Obtener el campeonato creado con sus torneos para retornar datos completos
        const createdCampeonato = await prisma.campeonato.findUnique({
            where: { id: result.id },
            include: { torneos: true }
        });

        if (!createdCampeonato) {
            return reply.code(500).send({ message: 'Error al obtener el campeonato creado' });
        }

        // Convertir Decimal a Number para consistencia con el schema
        const responseCallback = {
            ...createdCampeonato,
            torneos: createdCampeonato.torneos.map((t: any) => ({
                ...t,
                costoInscripcion: t.costoInscripcion ? parseFloat(t.costoInscripcion.toString()) : 0
            }))
        };

        return reply.code(201).send(responseCallback);
    } catch (e: any) {
        console.error('Error al crear campeonato:', e);
        return reply.code(500).send({ message: 'Error al crear campeonato', error: e.message });
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
        console.error('Error al obtener campeonatos:', e);
        return reply.code(500).send({ message: 'Error al obtener campeonatos', error: e.message });
    }
}

export async function createTorneoHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createTorneoSchema> }>,
    reply: FastifyReply
) {
    const data = request.body;

    try {
        // Mapear categoria a tipoSorteo para consistencia
        let tipoSorteo: string;
        switch (data.categoria) {
            case 'FASE_GRUPOS':
                tipoSorteo = 'GRUPOS';
                break;
            case 'ELIMINATORIA':
                tipoSorteo = 'BRACKET';
                break;
            case 'TODOS_CONTRA_TODOS':
                tipoSorteo = 'GRUPOS'; // Todos contra todos usa lógica de grupos
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
        return reply.code(500).send({ message: 'Error al crear torneo' });
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
            return reply.code(404).send({ message: 'Campeonato no encontrado' });
        }
        return reply.code(500).send({ message: 'Error al actualizar campeonato', error: e.message });
    }
}

export async function updateTorneoHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof updateTorneoSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const data = request.body;

    try {
        // Mapear categoria a tipoSorteo si categoria está siendo actualizada
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

        // Obtener todos los torneos en este campeonato
        const torneos = await prisma.torneo.findMany({
            where: { campeonatoId },
            select: { id: true }
        });

        // Eliminar todos los datos asociados para cada torneo
        for (const torneo of torneos) {
            // 1. Eliminar registros de Streaming asociados con partidos
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

            // 2. Eliminar Partidos
            await prisma.partido.deleteMany({
                where: { torneoId: torneo.id }
            });

            // 3. Eliminar Grupos asociados con inscripciones de equipos
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

            // 4. Eliminar Pagos asociados con el torneo
            await prisma.validacionpago.deleteMany({
                where: { torneoId: torneo.id }
            });

            // 5. Eliminar Inscripciones de Equipos
            await prisma.equipotorneo.deleteMany({
                where: { torneoId: torneo.id }
            });
        }

        // Eliminar todos los torneos
        await prisma.torneo.deleteMany({
            where: { campeonatoId }
        });

        // Finalmente eliminar el campeonato
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
        // Primero, eliminar todos los registros asociados para evitar restricciones de clave foránea
        const torneoId = Number(id);

        // 1. Eliminar registros de Streaming asociados con partidos
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

        // 2. Eliminar Partidos
        await prisma.partido.deleteMany({
            where: { torneoId }
        });

        // 3. Eliminar Grupos asociados con inscripciones de equipos
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

        // 4. Eliminar Pagos asociados con el torneo
        await prisma.validacionpago.deleteMany({
            where: { torneoId }
        });

        // 5. Eliminar Inscripciones de Equipos
        await prisma.equipotorneo.deleteMany({
            where: { torneoId }
        });

        // Ahora eliminar el torneo
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

    // TODO: Agregar 'force' al schema si se usa validación estricta. Por ahora asumiendo que está en settings o body si es flexible.
    // La actualización previa del servicio esperaba 'force' dentro de settings o como argumento separado?
    // Firma del servicio: generateDraw(torneoId, type, settings?: { ..., force?: boolean })
    // Así que solo necesitamos pasarlo en settings.

    try {
        const result = await drawService.generateDraw(Number(id), type, settings);
        return reply.code(201).send(result);
    } catch (e: any) {
        request.log.error(e);
        return reply.code(400).send({ message: e.message || 'Error al generar sorteo' });
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
        // Verificar propiedad/permiso
        if (user.rol !== 'ADMIN') {
            const team = await prisma.equipo.findUnique({
                where: { id: equipoId }
            });

            if (!team) {
                return reply.code(404).send({ message: 'Equipo no encontrado' });
            }

            if (team.capitanId !== user.id) {
                return reply.code(403).send({ message: 'Solo el capitán del equipo puede inscribir el equipo' });
            }
        }

        // Validación: Verificar si el equipo ya está inscrito
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
                message: 'Equipo ya inscrito en este torneo',
                status: existing.estado
            });
        }

        // Verificar costo del torneo
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
            return reply.code(400).send({ message: 'ID de equipo o torneo inválido' });
        }
        return reply.code(500).send({ message: 'Error al inscribir equipo' });
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
        return reply.code(400).send({ message: e.message || 'Error al promover a fase eliminatoria' });
    }
}
