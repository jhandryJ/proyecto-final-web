import { z } from 'zod';

export const createTeamSchema = z.object({
    nombre: z.string().min(3).max(50),
    logoUrl: z.string().optional(), // Allow hex colors or URLs
    facultad: z.string().optional(),
    capitanId: z.number().int().optional(),
    miembros: z.array(z.object({
        usuarioId: z.number().int(),
        dorsal: z.string().optional(),
        posicion: z.string().optional()
    })).optional()
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamResponseSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    logoUrl: z.string().nullable(),
    facultad: z.string().nullable(),
    capitanId: z.number(),
    capitan: z.object({
        id: z.number(),
        nombres: z.string(),
        email: z.string()
    }).optional()
});
