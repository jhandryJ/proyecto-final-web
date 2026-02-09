import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { addTeamToTorneoSchema, campeonatoResponseSchema, createCampeonatoSchema, createTorneoSchema, generateDrawSchema, updateCampeonatoSchema, updateTorneoSchema } from './tournaments.schemas.js';
import { createCampeonatoHandler, createTorneoHandler, getCampeonatosHandler, deleteCampeonatoHandler, deleteTorneoHandler, generateDrawHandler, updateCampeonatoHandler, updateTorneoHandler, createTeamRegistrationHandler, promoteToKnockoutHandler } from './tournaments.controller.js';
import { verifyRole } from '../auth/auth.middleware.js';
import { z } from 'zod';

export async function tournamentRoutes(app: FastifyInstance) {
    // Public routes
    app.withTypeProvider<ZodTypeProvider>().get('/campeonatos', {
        schema: {
            tags: ['Torneos'],
            summary: 'List all championships and tournaments',
            response: {
                200: z.array(campeonatoResponseSchema)
            }
        }
    }, getCampeonatosHandler);

    // Private routes (Reviewers/Admins)
    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                throw err;
            }
        });



        // Team Registration (Authenticated Users - Captains)
        privateApp.withTypeProvider<ZodTypeProvider>().post('/torneos/:id/inscripciones', {
            schema: {
                tags: ['Inscripciones'],
                summary: 'Register a team to a tournament',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                body: addTeamToTorneoSchema,
                response: {
                    201: z.object({ id: z.number(), estado: z.string() })
                }
            }
        }, createTeamRegistrationHandler);

        // Admin only routes
        privateApp.register(async (adminApp) => {
            adminApp.addHook('preHandler', verifyRole(['ADMIN']));

            adminApp.withTypeProvider<ZodTypeProvider>().post('/campeonatos', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Create a new championship',
                    security: [{ bearerAuth: [] }],
                    body: createCampeonatoSchema,
                    response: {
                        201: campeonatoResponseSchema
                    }
                }
            }, createCampeonatoHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().post('/torneos', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Add a tournament to a championship',
                    security: [{ bearerAuth: [] }],
                    body: createTorneoSchema,
                    response: {
                        201: z.object({ id: z.number(), disciplina: z.string() })
                    }
                }
            }, createTorneoHandler);


            adminApp.withTypeProvider<ZodTypeProvider>().put('/campeonatos/:id', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Update a championship',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    body: updateCampeonatoSchema,
                    response: {
                        200: campeonatoResponseSchema
                    }
                }
            }, updateCampeonatoHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().put('/torneos/:id', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Update a tournament',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    body: updateTorneoSchema,
                    response: {
                        200: z.object({ id: z.number(), disciplina: z.string() })
                    }
                }
            }, updateTorneoHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().delete('/campeonatos/:id', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Delete a championship',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    response: {
                        204: z.null()
                    }
                }
            }, deleteCampeonatoHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().delete('/torneos/:id', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Delete a tournament',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    response: {
                        204: z.null()
                    }
                }
            }, deleteTorneoHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().post('/torneos/:id/sorteo', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Generate draw (Brackets/Groups) for a tournament',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    body: generateDrawSchema,
                    response: {
                        201: z.any()
                    }
                }
            }, generateDrawHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().post('/torneos/:id/promover', {
                schema: {
                    tags: ['Torneos'],
                    summary: 'Promote teams from Group Stage to Knockout Stage',
                    security: [{ bearerAuth: [] }],
                    params: z.object({ id: z.string() }),
                    response: {
                        201: z.any()
                    }
                }
            }, promoteToKnockoutHandler);


        });
    });
}
