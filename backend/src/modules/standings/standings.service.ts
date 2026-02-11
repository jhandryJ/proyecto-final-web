import { prisma } from '../../utils/prisma.js';

export interface TeamStanding {
    equipoId: number;
    equipoNombre: string;
    logoUrl?: string;
    partidosJugados: number;
    ganados: number;
    empatados: number;
    perdidos: number;
    golesFavor: number;
    golesContra: number;
    diferencia: number;
    puntos: number;
    grupo?: string;
}

export interface TournamentStandings {
    torneoId: number;
    torneoNombre: string;
    tipoSorteo: string;
    equipos: TeamStanding[];
    grupos?: { [key: string]: TeamStanding[] };
}

/**
 * Calcula la tabla de posiciones para un torneo
 */
export async function calculateTournamentStandings(torneoId: number): Promise<TournamentStandings> {
    // Get tournament info
    const torneo = await prisma.torneo.findUnique({
        where: { id: torneoId },
        include: {
            campeonato: true,
            equiposInscritos: {
                include: {
                    equipo: true,
                    grupos: true
                }
            },
            partidos: {
                where: {
                    estado: 'FINALIZADO',
                    equipoLocalId: { not: null },
                    equipoVisitanteId: { not: null }
                },
                include: {
                    equipoLocal: true,
                    equipoVisitante: true
                }
            }
        }
    });

    if (!torneo) {
        throw new Error('Torneo no encontrado');
    }

    // Get all teams in tournament
    const equiposMap = new Map<number, TeamStanding>();

    // Initialize all teams with 0 stats
    for (const inscripcion of (torneo as any).equiposInscritos) {
        const grupo = inscripcion.grupos[0]?.nombre; // Get first group if exists
        equiposMap.set(inscripcion.equipoId, {
            equipoId: inscripcion.equipoId,
            equipoNombre: inscripcion.equipo.nombre,
            logoUrl: inscripcion.equipo.logoUrl || undefined,
            partidosJugados: 0,
            ganados: 0,
            empatados: 0,
            perdidos: 0,
            golesFavor: 0,
            golesContra: 0,
            diferencia: 0,
            puntos: 0,
            grupo: grupo
        });
    }

    // Calculate stats from matches
    for (const partido of (torneo as any).partidos) {
        if (!partido.equipoLocalId || !partido.equipoVisitanteId) continue;

        const marcadorLocal = partido.marcadorLocal || 0;
        const marcadorVisitante = partido.marcadorVisitante || 0;

        const statsLocal = equiposMap.get(partido.equipoLocalId);
        const statsVisitante = equiposMap.get(partido.equipoVisitanteId);

        if (!statsLocal || !statsVisitante) continue;

        // Update matches played
        statsLocal.partidosJugados++;
        statsVisitante.partidosJugados++;

        // Update goals
        statsLocal.golesFavor += marcadorLocal;
        statsLocal.golesContra += marcadorVisitante;
        statsVisitante.golesFavor += marcadorVisitante;
        statsVisitante.golesContra += marcadorLocal;

        // Determine result
        if (marcadorLocal > marcadorVisitante) {
            // Local wins
            statsLocal.ganados++;
            statsLocal.puntos += 3;
            statsVisitante.perdidos++;
        } else if (marcadorLocal < marcadorVisitante) {
            // Visitante wins
            statsVisitante.ganados++;
            statsVisitante.puntos += 3;
            statsLocal.perdidos++;
        } else {
            // Draw
            statsLocal.empatados++;
            statsLocal.puntos += 1;
            statsVisitante.empatados++;
            statsVisitante.puntos += 1;
        }

        // Update goal difference
        statsLocal.diferencia = statsLocal.golesFavor - statsLocal.golesContra;
        statsVisitante.diferencia = statsVisitante.golesFavor - statsVisitante.golesContra;
    }

    // Convert map to array and sort
    const equipos = Array.from(equiposMap.values()).sort((a, b) => {
        // Sort by points (descending)
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        // Then by goal difference (descending)
        if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
        // Then by goals for (descending)
        return b.golesFavor - a.golesFavor;
    });

    // Group by grupo if tournament has groups
    let grupos: { [key: string]: TeamStanding[] } | undefined;
    if (torneo.tipoSorteo === 'GRUPOS') {
        grupos = {};
        for (const equipo of equipos) {
            if (equipo.grupo) {
                if (!grupos[equipo.grupo]) {
                    grupos[equipo.grupo] = [];
                }
                grupos[equipo.grupo].push(equipo);
            }
        }
        // Sort each group
        for (const grupo in grupos) {
            grupos[grupo].sort((a, b) => {
                if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
                return b.golesFavor - a.golesFavor;
            });
        }
    }

    return {
        torneoId: torneo.id,
        torneoNombre: `${(torneo as any).campeonato?.nombre || 'Desconocido'} - ${torneo.categoria}`,
        tipoSorteo: torneo.tipoSorteo || 'BRACKET',
        equipos,
        grupos
    };
}

/**
 * Calcula las estadísticas para un equipo específico en un torneo
 */
export async function calculateTeamStats(equipoId: number, torneoId: number): Promise<TeamStanding | null> {
    const standings = await calculateTournamentStandings(torneoId);
    return standings.equipos.find(e => e.equipoId === equipoId) || null;
}
