import { FastifyInstance } from 'fastify';
import { getStreamsHandler, createStreamHandler, deleteStreamHandler, getChatHistoryHandler, likeStreamHandler } from './streaming.controller.js';
import { getStreamsResponseSchema, createStreamSchema, deleteStreamSchema } from './streaming.schemas.js';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function streamingRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/', {
        schema: {
            description: 'Obtener todos los streams activos',
            tags: ['Streaming'],
            response: {
                200: getStreamsResponseSchema
            }
        }
    }, getStreamsHandler);

    app.withTypeProvider<ZodTypeProvider>().get('/chat/:sala', {
        schema: {
            description: 'Obtener historial de chat de una sala',
            tags: ['Streaming'],
            params: z.object({
                sala: z.string()
            }),
            response: {
                200: z.array(z.any())
            }
        }
    }, getChatHistoryHandler);

    app.withTypeProvider<ZodTypeProvider>().patch('/:id/like', {
        schema: {
            description: 'Dar like a un stream',
            tags: ['Streaming'],
            params: z.object({
                id: z.string()
            }),
            response: {
                200: z.any()
            }
        }
    }, likeStreamHandler);

    app.withTypeProvider<ZodTypeProvider>().post('/', {
        schema: {
            description: 'Crear un nuevo stream',
            tags: ['Streaming'],
            body: createStreamSchema,
            response: {
                201: z.object({
                    id: z.number(),
                    partidoId: z.number(),
                    url: z.string(),
                    isLive: z.boolean()
                })
            }
        }
    }, createStreamHandler);

    app.withTypeProvider<ZodTypeProvider>().delete('/:id', {
        schema: {
            description: 'Eliminar un stream',
            tags: ['Streaming'],
            params: deleteStreamSchema,
            response: {
                204: z.null()
            }
        }
    }, deleteStreamHandler);
}
