import { FastifyReply, FastifyRequest } from 'fastify';
import { calculateTournamentStandings, calculateTeamStats } from './standings.service.js';

export async function getTournamentStandingsHandler(
    request: FastifyRequest<{ Params: { torneoId: string } }>,
    reply: FastifyReply
) {
    const { torneoId } = request.params;

    try {
        const standings = await calculateTournamentStandings(Number(torneoId));
        return reply.status(200).send(standings);
    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
            message: error.message || 'Error al calcular tabla de posiciones'
        });
    }
}

export async function getTeamStatsHandler(
    request: FastifyRequest<{
        Params: { equipoId: string; torneoId: string }
    }>,
    reply: FastifyReply
) {
    const { equipoId, torneoId } = request.params;

    try {
        const stats = await calculateTeamStats(Number(equipoId), Number(torneoId));

        if (!stats) {
            return reply.status(404).send({
                message: 'Equipo no encontrado en el torneo'
            });
        }

        return reply.status(200).send(stats);
    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
            message: error.message || 'Error al calcular estadísticas del equipo'
        });
    }
}
