import { z } from 'zod';

export const userResponseSchema = z.object({
    id: z.number(),
    cedula: z.string(),
    nombres: z.string(),
    apellidos: z.string(),
    email: z.string(),
    rol: z.enum(['ADMIN', 'CAPITAN', 'ESTUDIANTE']),
    facultad: z.string().nullable(),
    carrera: z.string().nullable(),
    createdAt: z.date().optional()
});
