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
            summary: 'List matches for a tournament',
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

        // Update Result - Admin or maybe Arbiter (if we had Arbiter Role)
        // For now Admin Only
        privateApp.register(async (adminApp) => {
            adminApp.addHook('preHandler', verifyRole(['ADMIN']));

            adminApp.withTypeProvider<ZodTypeProvider>().patch('/partidos/:id/resultado', {
                schema: {
                    tags: ['Partidos'],
                    summary: 'Update match score and status',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    body: updateMatchResultSchema,
                    response: {
                        200: z.any() // Returns the full updated match object, can refine schema if needed
                    }
                }
            }, updateMatchResultHandler);
        });

        // Get Next Match (Private, for User Dashboard)
        privateApp.withTypeProvider<ZodTypeProvider>().get('/next-match', {
            schema: {
                tags: ['Partidos'],
                summary: 'Get next upcoming match for logged in user',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.nullable(z.any()) // Returns match object or null
                }
            }
        }, getNextMatchHandler);
    });
}
