import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyRole } from '../auth/auth.middleware.js';
import {
    createArbitroHandler,
    getArbitrosHandler,
    createCanchaHandler,
    getCanchasHandler,
    getFacultiesHandler,
    getCareersHandler
} from './resources.controller.js';
import {
    createArbitroSchema,
    arbitroResponseSchema,
    createCanchaSchema,
    canchaResponseSchema
} from './resources.schemas.js';

export async function resourceRoutes(app: FastifyInstance) {

    // Public Routes (or Authenticated User but read-only)
    // For now letting public see resources might be useful, or restrict to Auth.
    // Let's protect everything for now, allow Students to see? 
    // Usually only Admins/Captains need to see lists, but viewing Matches will show them anyway.

    // Public Routes
    app.withTypeProvider<ZodTypeProvider>().get('/facultades', {
        schema: {
            tags: ['Recursos'],
            summary: 'List all faculties',
            description: 'Public endpoint for registration forms',
            // response schema simplified 
        }
    }, getFacultiesHandler);

    app.withTypeProvider<ZodTypeProvider>().get('/carreras', {
        schema: {
            tags: ['Recursos'],
            summary: 'List careers (optional filter by facultadId)',
            description: 'Public endpoint for registration forms',
            querystring: z.object({ facultadId: z.string().optional() }),
        }
    }, getCareersHandler);

    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            await request.jwtVerify();
        });

        // GET Routes - Accessible by any authenticated user
        privateApp.withTypeProvider<ZodTypeProvider>().get('/arbitros', {
            schema: {
                tags: ['Recursos'],
                summary: 'List all arbiters',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(arbitroResponseSchema)
                }
            }
        }, getArbitrosHandler);

        privateApp.withTypeProvider<ZodTypeProvider>().get('/canchas', {
            schema: {
                tags: ['Recursos'],
                summary: 'List all pitches',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(canchaResponseSchema)
                }
            }
        }, getCanchasHandler);

        // Admin Only Routes - Management
        privateApp.register(async (adminApp) => {
            adminApp.addHook('preHandler', verifyRole(['ADMIN']));

            adminApp.withTypeProvider<ZodTypeProvider>().post('/arbitros', {
                schema: {
                    tags: ['Recursos'],
                    summary: 'Create a new arbiter',
                    security: [{ bearerAuth: [] }],
                    body: createArbitroSchema,
                    response: {
                        201: arbitroResponseSchema
                    }
                }
            }, createArbitroHandler);

            adminApp.withTypeProvider<ZodTypeProvider>().post('/canchas', {
                schema: {
                    tags: ['Recursos'],
                    summary: 'Create a new pitch/field',
                    security: [{ bearerAuth: [] }],
                    body: createCanchaSchema,
                    response: {
                        201: canchaResponseSchema
                    }
                }
            }, createCanchaHandler);
        });
    });
}
