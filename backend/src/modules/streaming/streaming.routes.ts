import { FastifyInstance } from 'fastify';
import { getStreamsHandler, createStreamHandler, deleteStreamHandler, getChatHistoryHandler, likeStreamHandler } from './streaming.controller.js';
import { getStreamsResponseSchema, createStreamSchema, deleteStreamSchema } from './streaming.schemas.js';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function streamingRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/', {
        schema: {
            description: 'Get all active streams',
            tags: ['Streaming'],
            response: {
                200: getStreamsResponseSchema
            }
        }
    }, getStreamsHandler);

    app.withTypeProvider<ZodTypeProvider>().get('/chat/:sala', {
        schema: {
            description: 'Get chat history for a room',
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
            description: 'Like a stream',
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
            description: 'Create a new stream',
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
            description: 'Delete a stream',
            tags: ['Streaming'],
            params: deleteStreamSchema,
            response: {
                204: z.null()
            }
        }
    }, deleteStreamHandler);
}
