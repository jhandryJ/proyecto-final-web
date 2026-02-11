import { prisma } from '../../utils/prisma.js';

export class DrawService {

    async generateDraw(torneoId: number, type: 'BRACKET' | 'GRUPOS', settings?: { groupsCount?: number, manualAssignments?: Record<string, number[]>, force?: boolean }) {
        // 1. Validar equipos
        const inscripciones = await prisma.equipotorneo.findMany({
            where: {
                torneoId,
                estado: { not: 'RECHAZADO' }
            },
            include: { equipo: true }
        });

        if (inscripciones.length < 2) {
            throw new Error('No hay suficientes equipos para generar el sorteo (mínimo 2)');
        }

        // Limpiar sorteos previos si se fuerza
        const existingMatches = await prisma.partido.count({ where: { torneoId } });
        if (existingMatches > 0) {
            if (settings?.force) {
                // Delete existing matches and related data
                const matches = await prisma.partido.findMany({ where: { torneoId }, select: { id: true } });
                const matchIds = matches.map(m => m.id);

                await prisma.streaming.deleteMany({ where: { partidoId: { in: matchIds } } });
                await prisma.partido.deleteMany({ where: { torneoId } });

                // If switching types, we might need to clean up groups too, but for now we assume same type or clean slate
                if (type === 'BRACKET') {
                    // If we were in groups, maybe clean groups? 
                    // Let's safe clean groups just in case if shifting to pure bracket from scratch
                    const inscripcionIds = inscripciones.map(i => i.id);
                    await prisma.grupo.deleteMany({ where: { equipoTorneoId: { in: inscripcionIds } } });
                }
            } else {
                throw new Error('El sorteo ya existe. Use la opción de regenerar para sobrescribirlo.');
            }
        }

        if (type === 'BRACKET') {
            return this.generateBracket(torneoId, inscripciones);
        } else if (type === 'GRUPOS') {
            if (!settings?.groupsCount) throw new Error('groupsCount es requerido para GRUPOS');
            return this.generateGroups(torneoId, inscripciones, settings.groupsCount, settings.manualAssignments);
        }
    }

    async generateKnockoutFromGroups(torneoId: number) {
        // 1. Get all groups for this tournament
        const grupos = await prisma.grupo.findMany({
            where: {
                equipoTorneo: {
                    torneoId
                }
            },
            include: {
                equipoTorneo: {
                    include: {
                        equipo: true
                    }
                }
            }
        });

        if (grupos.length === 0) {
            throw new Error('No hay grupos configurados para este torneo');
        }

        // 2. Get standings to determine top teams from each group
        const groupNames = [...new Set(grupos.map(g => g.nombre))];
        const qualifiedTeams: any[] = [];

        for (const groupName of groupNames) {
            const groupTeams = grupos.filter(g => g.nombre === groupName);

            // Get matches for this group to calculate standings
            const teamIds = groupTeams.map(g => g.equipoTorneo.equipoId);
            const matches = await prisma.partido.findMany({
                where: {
                    torneoId,
                    fase: 'GRUPOS',
                    llave: `G${groupName}`,
                    estado: 'FINALIZADO'
                }
            });

            // Calculate standings
            const standings = new Map<number, { puntos: number, gf: number, gc: number, dif: number }>();

            for (const teamId of teamIds) {
                standings.set(teamId, { puntos: 0, gf: 0, gc: 0, dif: 0 });
            }

            for (const match of matches) {
                if (match.equipoLocalId && match.equipoVisitanteId &&
                    match.marcadorLocal !== null && match.marcadorVisitante !== null) {

                    const localStats = standings.get(match.equipoLocalId)!;
                    const visitanteStats = standings.get(match.equipoVisitanteId)!;

                    localStats.gf += match.marcadorLocal;
                    localStats.gc += match.marcadorVisitante;
                    visitanteStats.gf += match.marcadorVisitante;
                    visitanteStats.gc += match.marcadorLocal;

                    if (match.marcadorLocal > match.marcadorVisitante) {
                        localStats.puntos += 3;
                    } else if (match.marcadorLocal < match.marcadorVisitante) {
                        visitanteStats.puntos += 3;
                    } else {
                        localStats.puntos += 1;
                        visitanteStats.puntos += 1;
                    }

                    localStats.dif = localStats.gf - localStats.gc;
                    visitanteStats.dif = visitanteStats.gf - visitanteStats.gc;
                }
            }

            // Sort teams by standings (puntos, dif, gf)
            const sortedTeams = groupTeams.sort((a, b) => {
                const statsA = standings.get(a.equipoTorneo.equipoId)!;
                const statsB = standings.get(b.equipoTorneo.equipoId)!;

                if (statsB.puntos !== statsA.puntos) return statsB.puntos - statsA.puntos;
                if (statsB.dif !== statsA.dif) return statsB.dif - statsA.dif;
                return statsB.gf - statsA.gf;
            });

            // Take top 2 teams from each group (or top 1 if you prefer)
            const teamsToPromote = sortedTeams.slice(0, 2);
            qualifiedTeams.push(...teamsToPromote.map(t => ({
                id: t.equipoTorneo.equipoId,
                equipoId: t.equipoTorneo.equipoId,
                equipo: t.equipoTorneo.equipo
            })));
        }

        if (qualifiedTeams.length < 2) {
            throw new Error('No hay suficientes equipos clasificados para generar la fase eliminatoria');
        }

        // 3. Generate bracket with qualified teams (skip shuffle to maintain seeding)
        return this.generateBracket(torneoId, qualifiedTeams, true);
    }

    private async generateBracket(torneoId: number, teams: any[], skipShuffle: boolean = false) {
        // 1. Prepara equipos
        let seededTeams = skipShuffle ? [...teams] : [...teams].sort(() => 0.5 - Math.random());
        const count = seededTeams.length;

        // 2. Determinar tamaño del bracket (potencia de 2)
        let bracketSize = 2;
        while (bracketSize < count) {
            bracketSize *= 2;
        }

        // 3. Calcular Byes
        const byesCount = bracketSize - count;
        const matchesCount = count - byesCount; // Partidos reales en primera ronda = (count - byes) / 2 is incorrect math.
        // Logic:
        // Round 1 has 'bracketSize / 2' slots.
        // We have 'byesCount' matches that are "Team vs Bye".
        // We have '(bracketSize / 2) - byesCount' matches that are "Team vs Team".

        // Example: 6 Teams. Bracket Size 8. Byes = 2.
        // Slots = 4.
        // Matches vs Bye = 2.
        // Matches H2H = 4 - 2 = 2.
        // Total Teams used in vs Bye = 2 * 1 = 2.
        // Total Teams used in H2H = 2 * 2 = 4.
        // Total Teams = 2 + 4 = 6. Correct.

        // 4. Distribuir Byes equilibradamente
        // Estrategia: Intercalar partidos H2H y Solo (Bye) para que en la siguiente ronda
        // no se crucen dos ganadores de Bye si es posible evitarlo, o distribuidos.
        // Simplificación: Poner los Byes en los primeros seeds o dispersos.
        // Mejor: Crear lista de "Slots" de primera ronda.

        const totalSlots = bracketSize / 2; // Matches in first round (including byes)
        const slots: ('H2H' | 'BYE')[] = [];

        const h2hMatches = totalSlots - byesCount;

        // Fill slots array
        for (let i = 0; i < byesCount; i++) slots.push('BYE');
        for (let i = 0; i < h2hMatches; i++) slots.push('H2H');

        // Shuffle slots to distribute byes randomly/evenly?
        // Or keep them fixed to reward higher seeds if seeded? (Here random).
        // Let's standard distribute: top and bottom separate.
        // For simplicity and "fairness" in random draw, shuffle slots.
        // But to ensure flow, maybe distribute 1 Bye, 1 H2H...
        // Let's just shuffle the slots configuration.
        slots.sort(() => 0.5 - Math.random());

        // 5. Asignar equipos a slots
        // Necesitamos tomar equipos de 'seededTeams'.
        const firstRoundMatchesConfig = [];
        let teamIdx = 0;

        for (const slotType of slots) {
            if (slotType === 'BYE') {
                // Take 1 team
                if (teamIdx < count) {
                    firstRoundMatchesConfig.push({
                        local: seededTeams[teamIdx++],
                        visitante: null // BYE
                    });
                }
            } else {
                // Take 2 teams
                if (teamIdx + 1 < count) {
                    firstRoundMatchesConfig.push({
                        local: seededTeams[teamIdx++],
                        visitante: seededTeams[teamIdx++]
                    });
                }
            }
        }

        // 6. Generar fases
        let phases: { name: string, matches: number }[] = [];
        if (bracketSize === 2) phases = [{ name: 'FINAL', matches: 1 }];
        else if (bracketSize === 4) phases = [{ name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        else if (bracketSize === 8) phases = [{ name: 'CUARTOS', matches: 4 }, { name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        else if (bracketSize === 16) phases = [{ name: 'OCTAVOS', matches: 8 }, { name: 'CUARTOS', matches: 4 }, { name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        else if (bracketSize === 32) phases = [{ name: 'DIECISEISAVOS', matches: 16 }, { name: 'OCTAVOS', matches: 8 }, { name: 'CUARTOS', matches: 4 }, { name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];

        const allMatches = [];
        let nextRoundMatches: any[] = [];
        const reversedPhases = [...phases].reverse(); // Final -> Semis -> ...

        for (let i = 0; i < reversedPhases.length; i++) {
            const phase = reversedPhases[i];
            const currentRoundMatches = [];

            for (let j = 0; j < phase.matches; j++) {
                const nextMatchIndex = Math.floor(j / 2);
                const nextMatchSlot = j % 2 === 0 ? 'LOCAL' : 'VISITANTE';
                const nextMatch = nextRoundMatches.length > 0 ? nextRoundMatches[nextMatchIndex] : null;

                let equipoLocalId = null;
                let equipoVisitanteId = null;
                let estadoPartido = 'PROGRAMADO';
                let marcadorLocal = null;
                let marcadorVisitante = null;

                // Si es la primera ronda (la última del loop inverso)
                // Usamos la config generada
                if (i === reversedPhases.length - 1) {
                    // El array firstRoundMatchesConfig tiene 'phase.matches' elementos?
                    // Sí, porque totalSlots = bracketSize / 2 = phase.matches de la primera ronda.
                    // Pero ojo: el orden de firstRoundMatchesConfig puede no coincidir con el índice j 
                    // si queremos una estructura de árbol específica (semillas).
                    // Como es random, podemos tomar directo idx j.
                    const matchConfig = firstRoundMatchesConfig[j];
                    if (matchConfig) {
                        equipoLocalId = matchConfig.local ? (matchConfig.local.equipoId || matchConfig.local.id) : null; // Handle both Enrollment objects and direct Team objects (if promoted from groups)
                        equipoVisitanteId = matchConfig.visitante ? (matchConfig.visitante.equipoId || matchConfig.visitante.id) : null;

                        // Si es BYE (visitante null), el partido se da por finalizado y pasa el local
                        if (equipoLocalId && !equipoVisitanteId) {
                            estadoPartido = 'FINALIZADO';
                            marcadorLocal = 3;
                            marcadorVisitante = 0;
                            // Nota: La actualización del siguiente partido se hará después de crear este,
                            // o aquí mismo si ya tenemos el ID del siguiente (que sí lo tenemos porque vamos en reversa).
                        }
                    }
                }

                const partido = await prisma.partido.create({
                    data: {
                        torneoId,
                        equipoLocalId,
                        equipoVisitanteId,
                        fase: phase.name,
                        llave: `${phase.name.substring(0, 1)}${j + 1}`, // Q1, Q2, etc.
                        fechaHora: new Date(),
                        estado: estadoPartido,
                        marcadorLocal,
                        marcadorVisitante,
                        siguientePartidoId: nextMatch ? nextMatch.id : null,
                        siguienteSlot: nextMatch ? nextMatchSlot : null
                    } as any
                });

                currentRoundMatches.push(partido);
                allMatches.push(partido);

                // Auto-advance logic for BYEs immediately
                if (estadoPartido === 'FINALIZADO' && nextMatch && equipoLocalId) {
                    const updateData: any = {};
                    if (nextMatchSlot === 'LOCAL') updateData.equipoLocalId = equipoLocalId;
                    else updateData.equipoVisitanteId = equipoLocalId;

                    // Update the next match in DB
                    await prisma.partido.update({
                        where: { id: nextMatch.id },
                        data: updateData
                    });

                    // Update the nextMatch object in memory for next iterations (though we only go up, so maybe not strictly needed for logic but good for consistency)
                    if (nextMatchSlot === 'LOCAL') nextMatch.equipoLocalId = equipoLocalId;
                    else nextMatch.equipoVisitanteId = equipoLocalId;
                }
            }
            nextRoundMatches = currentRoundMatches;
        }

        await prisma.torneo.update({
            where: { id: torneoId },
            data: { tipoSorteo: 'BRACKET' } as any
        });

        return { message: 'Llaves generadas exitosamente', matchesCreated: allMatches.length };
    }

    private async generateGroups(torneoId: number, teams: any[], groupsCount: number, manualAssignments?: Record<string, number[]>) {
        const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const groupsMap = new Map<string, any[]>();

        // Si hay asignación manual, usarla
        if (manualAssignments && Object.keys(manualAssignments).length > 0) {
            for (const [groupName, teamIds] of Object.entries(manualAssignments)) {
                if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);

                for (const teamId of teamIds) {
                    // Validar que el equipo pertenece a las inscripciones válidas
                    const team = teams.find(t => t.equipoId === teamId);
                    if (team) {
                        await prisma.grupo.create({
                            data: {
                                nombre: groupName,
                                equipoTorneoId: team.id
                            }
                        });
                        groupsMap.get(groupName)?.push(team);
                    }
                }
            }
        } else {
            // Asignación aleatoria (Lógica existente)
            const shuffled = [...teams].sort(() => 0.5 - Math.random());

            for (let i = 0; i < shuffled.length; i++) {
                const groupIndex = i % groupsCount;
                const groupName = groupNames[groupIndex];
                const team = shuffled[i];

                await prisma.grupo.create({
                    data: {
                        nombre: groupName,
                        equipoTorneoId: team.id
                    }
                });

                if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
                groupsMap.get(groupName)?.push(team);
            }
        }

        // Generar partidos (Round Robin por grupo)
        const partidosToCreate = [];

        for (const [name, groupTeams] of groupsMap.entries()) {
            // Todos contra todos
            if (!groupTeams || groupTeams.length < 2) continue; // Skip groups with < 2 teams

            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    partidosToCreate.push({
                        torneoId,
                        equipoLocalId: groupTeams[i].equipoId,
                        equipoVisitanteId: groupTeams[j].equipoId,
                        fase: 'GRUPOS',
                        llave: `G${name}`, // Grupo A
                        fechaHora: new Date(),
                        estado: 'PROGRAMADO'
                    });
                }
            }
        }

        if (partidosToCreate.length > 0) {
            await prisma.partido.createMany({ data: partidosToCreate as any });
        }

        // TODO: Remove 'as any' after running 'npx prisma generate' when the server is stopped
        await prisma.torneo.update({
            where: { id: torneoId },
            data: { tipoSorteo: 'GRUPOS', configuracion: { groupsCount } } as any
        });

        return { message: 'Group stage generated', matchesCreated: partidosToCreate.length };
    }
}

export const drawService = new DrawService();
