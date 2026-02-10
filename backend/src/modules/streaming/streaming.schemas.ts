import { z } from 'zod';

export const streamEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    matchup: z.object({
        id: z.string(),
        team1: z.string(),
        team2: z.string(),
        date: z.string(),
        location: z.string(),
        round: z.number().optional()
    }),
    streamUrl: z.string(),
    scheduledDate: z.string(),
    status: z.enum(['upcoming', 'live', 'ended']),
    viewers: z.number().optional(),
    likes: z.number().optional()
});

export const createStreamSchema = z.object({
    partidoId: z.number(),
    url: z.string().url(),
    isLive: z.boolean().default(true)
});

export const deleteStreamSchema = z.object({
    id: z.string()
});

export const getStreamsResponseSchema = z.array(streamEventSchema);
