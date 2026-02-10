import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyRole } from '../auth/auth.middleware.js';
import { getTournamentMatchesHandler, updateMatchResultHandler, getNextMatchHandler } from './matches.controller.js';
import { matchResponseSchema, updateMatchResultSchema } from './matches.schemas.js';

export async function matchRoutes(app: FastifyInstance) {

    // Public/Shared Routes
    app.withTypeProvider<ZodTypeProvider>().get('/torneos/:torneoId/partidos', {
        schema: {
            tags: ['Partidos'],
            summary: 'Listar partidos de un torneo',
            params: z.object({ torneoId: z.string() }),
            response: {
                200: z.array(matchResponseSchema)
            }
        }
    }, getTournamentMatchesHandler);

    // Private Routes
    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            await request.jwtVerify();
        });

        // Actualizar Resultado - Admin o tal vez Árbitro (si tuviéramos Rol de Árbitro)
        // Por ahora solo Admin
        privateApp.register(async (adminApp) => {
            adminApp.addHook('preHandler', verifyRole(['ADMIN']));

            adminApp.withTypeProvider<ZodTypeProvider>().patch('/partidos/:id/resultado', {
                schema: {
                    tags: ['Partidos'],
                    summary: 'Actualizar marcador y estado del partido',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    body: updateMatchResultSchema,
                    response: {
                        200: z.any() // Retorna el objeto de partido actualizado completo, se puede refinar el schema si es necesario
                    }
                }
            }, updateMatchResultHandler);
        });

        // Obtener Próximo Partido (Privado, para Dashboard de Usuario)
        privateApp.withTypeProvider<ZodTypeProvider>().get('/next-match', {
            schema: {
                tags: ['Partidos'],
                summary: 'Obtener próximo partido del usuario autenticado',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.nullable(z.any()) // Retorna objeto de partido o null
                }
            }
        }, getNextMatchHandler);
    });
}
