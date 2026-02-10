import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginResponseSchema, loginUserSchema, registerUserSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';
import { loginUserHandler, registerUserHandler, deleteUserHandler, promoteToCaptainHandler, forgotPasswordHandler, resetPasswordHandler } from './auth.controller.js';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/register', {
        schema: {
            tags: ['Auth'],
            summary: 'Registrar un nuevo usuario',
            body: registerUserSchema,
            response: {
                201: z.object({
                    id: z.number(),
                    email: z.string(),
                    nombres: z.string(),
                    rol: z.string()
                }),
                409: z.object({ message: z.string() })
            }
        }
    }, registerUserHandler);

    app.withTypeProvider<ZodTypeProvider>().post('/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Inicio de sesión de usuario',
            body: loginUserSchema,
            response: {
                200: loginResponseSchema,
                401: z.object({ message: z.string() })
            }
        }
    }, loginUserHandler);

    app.withTypeProvider<ZodTypeProvider>().delete('/users/:id', {
        onRequest: [async (request) => await request.jwtVerify()],
        schema: {
            tags: ['Auth'], // Or 'Users' if I update app.ts, but 'Auth' requested implies context
            summary: 'Eliminar un usuario (Solo Admin)',
            description: 'Elimina un usuario por su ID. Requiere ser ADMIN.',
            params: z.object({
                id: z.string().describe('ID de Usuario')
            }),
            security: [{ bearerAuth: [] }],
            response: {
                204: z.null().describe('Usuario eliminado exitosamente'),
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        }
    }, deleteUserHandler);

    app.withTypeProvider<ZodTypeProvider>().post('/promote-captain', {
        onRequest: [async (request) => await request.jwtVerify()],
        schema: {
            tags: ['Auth'],
            summary: 'Promover usuario a Capitán',
            description: 'Cambia el rol del usuario autenticado de ESTUDIANTE a CAPITAN.',
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    message: z.string(),
                    user: z.object({
                        id: z.number(),
                        email: z.string(),
                        rol: z.string()
                    }),
                    accessToken: z.string().describe('Nuevo token con rol actualizado')
                }),
                400: z.object({ message: z.string() }),
                403: z.object({ message: z.string() })
            }
        }
    }, promoteToCaptainHandler);

    app.withTypeProvider<ZodTypeProvider>().post('/forgot-password', {
        schema: {
            tags: ['Auth'],
            summary: 'Solicitar restablecimiento de contraseña',
            description: 'Solicita un token de recuperación de contraseña que se envía por email.',
            body: forgotPasswordSchema,
            response: {
                200: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, forgotPasswordHandler);

    app.withTypeProvider<ZodTypeProvider>().post('/reset-password', {
        schema: {
            tags: ['Auth'],
            summary: 'Restablecer contraseña con token',
            description: 'Resetea la contraseña usando un token válido de recuperación.',
            body: resetPasswordSchema,
            response: {
                200: z.object({ message: z.string() }),
                400: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, resetPasswordHandler);
}
