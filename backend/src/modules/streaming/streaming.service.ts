import { prisma } from '../../utils/prisma.js';

export class StreamingService {
    async getStreams() {
        const streams = await prisma.streaming.findMany({
            include: {
                partido: {
                    include: {
                        equipoLocal: true,
                        equipoVisitante: true,
                        cancha: true
                    }
                }
            },
            orderBy: {
                partido: {
                    fechaHora: 'asc'
                }
            }
        });

        return streams.map((stream: any) => {
            const partido = stream.partido;
            const now = new Date();
            const matchDate = new Date(partido.fechaHora);

            // Determine status
            let status: 'upcoming' | 'live' | 'ended' = 'upcoming';
            if (stream.isLive) {
                status = 'live';
            } else if ((partido.estado as string) === 'FINALIZADO') {
                status = 'ended';
            } else if (now >= matchDate && (partido.estado as string) !== 'FINALIZADO') {
                // If match time has passed but not finished, and isLive is false, 
                // it might be effectively live or just late. 
                // For safety if isLive flag is explicit, rely on it.
                // But if we want to auto-detect "live" based on time:
                // status = 'live'; 
                // Let's stick to the DB flag for 'live' status to be precise.
                status = 'upcoming';
            }

            return {
                id: stream.id.toString(),
                title: `${partido.equipoLocal?.nombre || 'TBD'} vs ${partido.equipoVisitante?.nombre || 'TBD'}`,
                matchup: {
                    id: partido.id.toString(),
                    team1: partido.equipoLocal?.nombre || 'Por definir',
                    team2: partido.equipoVisitante?.nombre || 'Por definir',
                    date: partido.fechaHora.toISOString(),
                    location: partido.cancha?.nombre || 'Por definir',
                    round: 0 // We might want to map phase/round if available
                },
                streamUrl: stream.url,
                scheduledDate: partido.fechaHora.toISOString(),
                status: status,
                viewers: (stream as any).views || 0,
                likes: (stream as any).likes || 0
            };
        });
    }

    async getChatHistory(sala: string) {
        return prisma.mensajeChat.findMany({
            where: { sala },
            include: {
                usuario: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha: 'asc'
            },
            take: 100 // Last 100 messages
        });
    }

    async likeStream(id: number) {
        return (prisma.streaming as any).update({
            where: { id },
            data: {
                likes: {
                    increment: 1
                }
            }
        });
    }

    async createStream(data: { partidoId: number; url: string; isLive: boolean }) {
        return prisma.streaming.create({
            data: {
                partidoId: data.partidoId,
                url: data.url,
                isLive: data.isLive
            }
        });
    }

    async updateStream(id: number, data: { isLive?: boolean, url?: string, clearChat?: boolean }) {
        if (data.clearChat) {
            await prisma.mensajeChat.deleteMany({
                where: {
                    sala: `stream-${id}`
                }
            });
        }

        const updateData: any = {};
        if (data.isLive !== undefined) updateData.isLive = data.isLive;
        if (data.url !== undefined) updateData.url = data.url;

        return prisma.streaming.update({
            where: { id },
            data: updateData
        });
    }

    async deleteStream(id: number) {
        // First delete chat messages associated with this stream
        await prisma.mensajeChat.deleteMany({
            where: {
                sala: `stream-${id}`
            }
        });

        return prisma.streaming.delete({
            where: { id }
        });
    }
}

export const streamingService = new StreamingService();
