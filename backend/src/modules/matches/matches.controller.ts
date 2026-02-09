import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prisma.js';
import { updateMatchResultSchema } from './matches.schemas.js';
import { z } from 'zod';

export async function getTournamentMatchesHandler(
    request: FastifyRequest<{ Params: { torneoId: string } }>,
    reply: FastifyReply
) {
    const { torneoId } = request.params;

    try {
        const partidos = await prisma.partido.findMany({
            where: { torneoId: Number(torneoId) },
            include: {
                equipoLocal: { select: { id: true, nombre: true, logoUrl: true } },
                equipoVisitante: { select: { id: true, nombre: true, logoUrl: true } },
                cancha: { select: { nombre: true } },
                arbitro: { select: { nombres: true } }
            },
            orderBy: { fechaHora: 'asc' }
        });
        return reply.status(200).send(partidos);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching matches' });
    }
}

export async function updateMatchResultHandler(
    request: FastifyRequest<{
        Params: { id: string },
        Body: z.infer<typeof updateMatchResultSchema>
    }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { marcadorLocal, marcadorVisitante, estado, fechaHora, canchaId } = request.body;

    try {
        // 1. Update the match
        const partido = await prisma.partido.update({
            where: { id: Number(id) },
            data: {
                marcadorLocal,
                marcadorVisitante,
                estado: estado || undefined,
                fechaHora: fechaHora ? new Date(fechaHora) : undefined,
                canchaId: canchaId
            },
            include: {
                equipoLocal: true,
                equipoVisitante: true
            }
        });

        // 2. Advance winner if Bracket and Finalized
        // 2. Advance winner if Bracket and Finalized
        // TODO: Remove 'as any' once prisma generate runs successfully to update types
        const siguientePartidoId = (partido as any).siguientePartidoId as number | null;
        const siguienteSlot = (partido as any).siguienteSlot as string | null;

        if (partido.estado === 'FINALIZADO' && siguientePartidoId && siguienteSlot) {
            let winnerId: number | null = null;

            if (partido.marcadorLocal! > partido.marcadorVisitante!) {
                winnerId = partido.equipoLocalId;
            } else if (partido.marcadorVisitante! > partido.marcadorLocal!) {
                winnerId = partido.equipoVisitanteId;
            } else {
                // Penalties logic needed? For MVP assume no draws in brackets or manual handling
                // If draw, we don't advance automatically yet.
            }

            if (winnerId) {
                const updateData: any = {};
                if (siguienteSlot === 'LOCAL') {
                    updateData.equipoLocalId = winnerId;
                } else if (siguienteSlot === 'VISITANTE') {
                    updateData.equipoVisitanteId = winnerId;
                }

                await prisma.partido.update({
                    where: { id: siguientePartidoId },
                    data: updateData
                });

                request.log.info(`Advanced winner ${winnerId} to match ${siguientePartidoId} as ${siguienteSlot}`);
            }
        }

        return reply.status(200).send(partido);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error updating match result' });
    }
}

export async function getNextMatchHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const userId = request.user.id;

        // 1. Get user's teams
        const miembros = await prisma.miembroequipo.findMany({
            where: { usuarioId: userId },
            select: { equipoId: true }
        });
        const teamIds = miembros.map((m: { equipoId: number }) => m.equipoId);

        // Also check if user is captain of any team
        const captainTeams = await prisma.equipo.findMany({
            where: { capitanId: userId },
            select: { id: true }
        });
        const allTeamIds = [...new Set([...teamIds, ...captainTeams.map(t => t.id)])];

        if (allTeamIds.length === 0) {
            return reply.status(200).send(null);
        }

        // 2. Find next match for these teams
        const nextMatch = await prisma.partido.findFirst({
            where: {
                OR: [
                    { equipoLocalId: { in: allTeamIds } },
                    { equipoVisitanteId: { in: allTeamIds } }
                ],
                estado: { in: ['PROGRAMADO'] },
                // Allow matches scheduled up to 4 hours ago (e.g., currently playing or just finished but not updated)
                fechaHora: { gt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
            },
            orderBy: { fechaHora: 'asc' },
            include: {
                equipoLocal: { select: { id: true, nombre: true, logoUrl: true } },
                equipoVisitante: { select: { id: true, nombre: true, logoUrl: true } },
                cancha: { select: { nombre: true } },
                torneo: { select: { disciplina: true, categoria: true, genero: true } }
            }
        });

        return reply.status(200).send(nextMatch);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching next match' });
    }
}
