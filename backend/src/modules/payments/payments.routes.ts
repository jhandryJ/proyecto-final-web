import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createPaymentSchema, validatePaymentSchema, paymentResponseSchema } from './payments.schemas.js';
import {
    createPaymentHandler,
    getPaymentsHandler,
    getPendingPaymentsHandler,
    getPaymentHandler,
    validatePaymentHandler
} from './payments.controller.js';
import { z } from 'zod';

export async function paymentRoutes(app: FastifyInstance) {
    // Todas las rutas de pagos requieren autenticación
    app.register(async (privateApp) => {
        privateApp.addHook('onRequest', async (request) => {
            await request.jwtVerify();
        });

        // Listar pagos (con filtros RLS)
        privateApp.withTypeProvider<ZodTypeProvider>().get('/', {
            schema: {
                tags: ['Pagos'],
                summary: 'Listar pagos según permisos del usuario',
                description: 'ADMIN ve todos los pagos. USUARIOS ven solo los pagos que ellos han subido.',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(paymentResponseSchema.extend({
                        equipo: z.object({
                            id: z.number(),
                            nombre: z.string()
                        }),
                        usuarioPago: z.object({
                            id: z.number(),
                            nombres: z.string(),
                            email: z.string()
                        }),
                        validadoPor: z.object({
                            id: z.number(),
                            nombres: z.string()
                        }).nullable()
                    }))
                }
            }
        }, getPaymentsHandler);

        // Listar pagos pendientes (ADMIN)
        privateApp.withTypeProvider<ZodTypeProvider>().get('/pendientes', {
            schema: {
                tags: ['Pagos'],
                summary: 'Listar pagos pendientes de validación (Admin)',
                description: 'Endpoint exclusivo para administradores.',
                security: [{ bearerAuth: [] }],
                response: {
                    200: z.array(paymentResponseSchema.extend({
                        equipo: z.object({
                            id: z.number(),
                            nombre: z.string()
                        }),
                        usuarioPago: z.object({
                            id: z.number(),
                            nombres: z.string(),
                            email: z.string()
                        }),
                        validadoPor: z.object({
                            id: z.number(),
                            nombres: z.string()
                        }).nullable()
                    }))
                }
            }
        }, getPendingPaymentsHandler);

        // Obtener un pago específico
        privateApp.withTypeProvider<ZodTypeProvider>().get('/:id', {
            schema: {
                tags: ['Pagos'],
                summary: 'Obtener detalles de un pago',
                description: 'Permite ver el detalle si eres ADMIN o si el pago es tuyo.',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                response: {
                    200: paymentResponseSchema.extend({
                        equipo: z.object({
                            id: z.number(),
                            nombre: z.string()
                        }),
                        usuarioPago: z.object({
                            id: z.number(),
                            nombres: z.string(),
                            email: z.string()
                        }),
                        validadoPor: z.object({
                            id: z.number(),
                            nombres: z.string()
                        }).nullable()
                    }),
                    404: z.object({ message: z.string() })
                }
            }
        }, getPaymentHandler);

        // Crear solicitud de pago (CAPITAN/ESTUDIANTE)
        privateApp.withTypeProvider<ZodTypeProvider>().post('/', {
            schema: {
                tags: ['Pagos'],
                summary: 'Crear solicitud de pago',
                description: 'Usuarios pueden subir sus comprobantes de pago.',
                security: [{ bearerAuth: [] }],
                body: createPaymentSchema,
                response: {
                    201: paymentResponseSchema,
                    403: z.object({ message: z.string() })
                }
            }
        }, createPaymentHandler);

        // Validar/Rechazar pago (solo ADMIN)
        privateApp.withTypeProvider<ZodTypeProvider>().patch('/:id/validar', {
            schema: {
                tags: ['Pagos'],
                summary: 'Validar o rechazar pago',
                description: 'Solo administradores pueden validar o rechazar pagos. Cambia el estado del pago y potencialmente el estado de inscripción del equipo.',
                security: [{ bearerAuth: [] }],
                params: z.object({ id: z.string() }),
                body: validatePaymentSchema,
                response: {
                    200: paymentResponseSchema.extend({
                        equipo: z.object({
                            id: z.number(),
                            nombre: z.string()
                        }),
                        usuarioPago: z.object({
                            id: z.number(),
                            nombres: z.string(),
                            email: z.string()
                        })
                    }),
                    400: z.object({ message: z.string() }),
                    403: z.object({ message: z.string() }),
                    404: z.object({ message: z.string() })
                }
            }
        }, validatePaymentHandler);
    });
}
