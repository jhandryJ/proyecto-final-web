import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createTeamSchema, teamResponseSchema, updateTeamSchema } from './teams.schemas.js';
import { createTeamHandler, getTeamHandler, getTeamsHandler, updateTeamHandler, getUserTeamsHandler, getAvailableTeamsHandler, joinTeamHandler, deleteTeamHandler, leaveTeamHandler } from './teams.controller.js';
import { z } from 'zod';

export async function teamRoutes(app: FastifyInstance) {

    // Private Routes - Requieren autenticación para aplicar RLS
    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            await request.jwtVerify();
        });

        // GET / - Con RLS aplicado
        privateApp.withTypeProvider<ZodTypeProvider>().get('/', {
            schema: {
                tags: ['Equipos'],
                summary: 'List all teams (with RLS)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(teamResponseSchema)
                }
            }
        }, getTeamsHandler);

        // GET /:id - Con RLS aplicado
        privateApp.withTypeProvider<ZodTypeProvider>().get('/:id', {
            schema: {
                tags: ['Equipos'],
                summary: 'Get team details (with RLS)',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: teamResponseSchema.extend({
                        miembros: z.array(z.object({
                            usuario: z.object({
                                id: z.number(),
                                nombres: z.string(),
                                email: z.string()
                            })
                        })).optional()
                    })
                }
            }
        }, getTeamHandler);

        // POST /
        privateApp.withTypeProvider<ZodTypeProvider>().post('/', {
            schema: {
                tags: ['Equipos'],
                summary: 'Create a new team',
                security: [{ bearerAuth: [] }],
                body: createTeamSchema,
                response: {
                    201: teamResponseSchema
                }
            }
        }, createTeamHandler);

        // PUT /:id
        privateApp.withTypeProvider<ZodTypeProvider>().put('/:id', {
            schema: {
                tags: ['Equipos'],
                summary: 'Update team details',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                body: updateTeamSchema,
                response: {
                    200: teamResponseSchema
                }
            }
        }, updateTeamHandler);


        // GET /mis-equipos
        privateApp.withTypeProvider<ZodTypeProvider>().get('/mis-equipos', {
            schema: {
                tags: ['Equipos'],
                summary: 'Get current user teams',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(teamResponseSchema)
                }
            }
        }, getUserTeamsHandler);

        // GET /disponibles
        privateApp.withTypeProvider<ZodTypeProvider>().get('/disponibles', {
            schema: {
                tags: ['Equipos'],
                summary: 'Get available teams (not in tournament)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(teamResponseSchema)
                }
            }
        }, getAvailableTeamsHandler);

        // POST /:id/join
        privateApp.withTypeProvider<ZodTypeProvider>().post('/:id/join', {
            schema: {
                tags: ['Equipos'],
                summary: 'Join a team',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: z.object({ message: z.string() })
                }
            }
        }, joinTeamHandler);

        // DELETE /:id
        privateApp.withTypeProvider<ZodTypeProvider>().delete('/:id', {
            schema: {
                tags: ['Equipos'],
                summary: 'Delete a team',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    204: z.null()
                }
            }
        }, deleteTeamHandler);

        // POST /:id/leave
        privateApp.withTypeProvider<ZodTypeProvider>().post('/:id/leave', {
            schema: {
                tags: ['Equipos'],
                summary: 'Leave a team',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: z.object({ message: z.string() })
                }
            }
        }, leaveTeamHandler);
    });
}
