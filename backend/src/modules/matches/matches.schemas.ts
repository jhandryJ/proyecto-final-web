import { z } from 'zod';

export const updateMatchResultSchema = z.object({
    marcadorLocal: z.number().min(0).optional(),
    marcadorVisitante: z.number().min(0).optional(),
    estado: z.enum(['PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO']).optional(),
    fechaHora: z.string().datetime().optional(), // Expect ISO string
    canchaId: z.number().optional()
});

export const matchResponseSchema = z.object({
    id: z.number(),
    torneoId: z.number(),
    fase: z.string().nullable(),
    llave: z.string().nullable(),
    fechaHora: z.date(), // Zod handles dates as Date objects often, or string with coercion
    estado: z.string(),
    marcadorLocal: z.number().nullable(),
    marcadorVisitante: z.number().nullable(),
    equipoLocal: z.object({
        id: z.number(),
        nombre: z.string(),
        logoUrl: z.string().nullable()
    }).nullable(),
    equipoVisitante: z.object({
        id: z.number(),
        nombre: z.string(),
        logoUrl: z.string().nullable()
    }).nullable(),
    cancha: z.object({
        nombre: z.string()
    }).nullable().optional(),
    arbitro: z.object({
        nombres: z.string()
    }).nullable().optional()
});
