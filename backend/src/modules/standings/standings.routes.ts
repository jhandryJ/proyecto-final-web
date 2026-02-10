import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { getTournamentStandingsHandler, getTeamStatsHandler } from './standings.controller.js';
import { tournamentStandingsSchema, teamStandingSchema } from './standings.schemas.js';

export async function standingsRoutes(app: FastifyInstance) {
    // Public Routes - Anyone can view standings
    app.withTypeProvider<ZodTypeProvider>().get('/torneos/:torneoId/posiciones', {
        schema: {
            tags: ['Posiciones'],
            summary: 'Get tournament standings table',
            params: z.object({ torneoId: z.string() }),
            response: {
                200: tournamentStandingsSchema
            }
        }
    }, getTournamentStandingsHandler);

    app.withTypeProvider<ZodTypeProvider>().get('/equipos/:equipoId/estadisticas/:torneoId', {
        schema: {
            tags: ['Posiciones'],
            summary: 'Get team statistics in a tournament',
            params: z.object({
                equipoId: z.string(),
                torneoId: z.string()
            }),
            response: {
                200: teamStandingSchema,
                404: z.object({ message: z.string() })
            }
        }
    }, getTeamStatsHandler);
}
