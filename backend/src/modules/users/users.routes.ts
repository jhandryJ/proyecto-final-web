import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { userResponseSchema } from './users.schemas.js';
import { getUserHandler, getUsersHandler } from './users.controller.js';
import { z } from 'zod';

export async function userRoutes(app: FastifyInstance) {

    // Private Routes - Requieren autenticación para aplicar RLS
    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            await request.jwtVerify();
        });

        // GET / - Con RLS aplicado
        privateApp.withTypeProvider<ZodTypeProvider>().get('/', {
            schema: {
                tags: ['Usuarios'],
                summary: 'List all users (with RLS)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(userResponseSchema)
                }
            }
        }, getUsersHandler);

        // GET /:id - Con RLS aplicado
        privateApp.withTypeProvider<ZodTypeProvider>().get('/:id', {
            schema: {
                tags: ['Usuarios'],
                summary: 'Get user details (with RLS)',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: userResponseSchema
                }
            }
        }, getUserHandler);
    });
}
