import { z } from 'zod';

// --- Esquemas para Árbitros ---

export const createArbitroSchema = z.object({
    nombres: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    contacto: z.string().optional()
});

export const arbitroResponseSchema = z.object({
    id: z.number(),
    nombres: z.string(),
    contacto: z.string().nullable().optional()
});

// --- Esquemas para Canchas ---

export const createCanchaSchema = z.object({
    nombre: z.string().min(3, 'El nombre de la cancha es requerido'),
    ubicacion: z.string().optional()
});

export const canchaResponseSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    ubicacion: z.string().nullable().optional()
});

// --- Esquemas para Carreras ---

export const carreraResponseSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    facultadId: z.number()
});

// --- Esquemas para Facultades ---

export const facultadResponseSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    carreras: z.array(carreraResponseSchema).optional()
});
