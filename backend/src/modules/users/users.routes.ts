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
                summary: 'Listar todos los usuarios (con RLS)',
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
                summary: 'Obtener detalles del usuario (con RLS)',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: userResponseSchema
                }
            }
        }, getUserHandler);
    });
}
