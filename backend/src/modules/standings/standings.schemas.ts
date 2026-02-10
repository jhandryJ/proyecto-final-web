import { z } from 'zod';

export const teamStandingSchema = z.object({
    equipoId: z.number(),
    equipoNombre: z.string(),
    logoUrl: z.string().optional(),
    partidosJugados: z.number(),
    ganados: z.number(),
    empatados: z.number(),
    perdidos: z.number(),
    golesFavor: z.number(),
    golesContra: z.number(),
    diferencia: z.number(),
    puntos: z.number(),
    grupo: z.string().optional()
});

export const tournamentStandingsSchema = z.object({
    torneoId: z.number(),
    torneoNombre: z.string(),
    tipoSorteo: z.string(),
    equipos: z.array(teamStandingSchema),
    grupos: z.record(z.array(teamStandingSchema)).optional()
});
