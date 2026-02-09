import { z } from 'zod';

export const createCampeonatoSchema = z.object({
    nombre: z.string().min(3).describe('Name of the Championship'),
    anio: z.number().int().min(2025).describe('Year of the championship'),
    fechaInicio: z.any().describe('Start date'), // Flexible for Date or string
    fechaFin: z.any().optional().describe('End date')
});

export const createTorneoSchema = z.object({
    campeonatoId: z.number().int(),
    disciplina: z.enum(['FUTBOL', 'BASKET', 'ECUAVOLEY']),
    categoria: z.enum(['ELIMINATORIA', 'FASE_GRUPOS', 'TODOS_CONTRA_TODOS']), // Ahora define el formato
    genero: z.enum(['MASCULINO', 'FEMENINO', 'MIXTO']), // Ahora define el género
    costoInscripcion: z.number().min(0).optional().default(0)
});

export const updateCampeonatoSchema = createCampeonatoSchema.partial();

export const updateTorneoSchema = createTorneoSchema.partial();

export const campeonatoResponseSchema = createCampeonatoSchema.extend({
    id: z.number(),
    torneos: z.array(z.object({
        id: z.number(),
        disciplina: z.string(),
        categoria: z.string(),
        genero: z.string().nullish(),
        tipoSorteo: z.string().nullish(),
        configuracion: z.any().nullish(),
        costoInscripcion: z.number().nullish(), // Added field
        campeonatoId: z.number(),
        inscripciones: z.array(z.object({
            estado: z.string(),
            equipoId: z.number(), // Added ID
            equipo: z.object({
                nombre: z.string()
            }),
            grupos: z.array(z.object({
                id: z.number(),
                nombre: z.string()
            })).optional()
        })).optional()
    })).optional()
});

export const generateDrawSchema = z.object({
    type: z.enum(['BRACKET', 'GRUPOS']),
    settings: z.object({
        groupsCount: z.number().int().min(2).optional(),
        manualAssignments: z.record(z.array(z.number())).optional()
    }).optional()
});

export const addTeamToTorneoSchema = z.object({
    equipoId: z.number().int()
});
