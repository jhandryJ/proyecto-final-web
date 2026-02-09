import { prisma } from '../../utils/prisma.js';

export class DrawService {

    async generateDraw(torneoId: number, type: 'BRACKET' | 'GRUPOS', settings?: { groupsCount?: number, manualAssignments?: Record<string, number[]> }) {
        // 1. Validar equipos
        const inscripciones = await prisma.equipotorneo.findMany({
            where: {
                torneoId,
                estado: { not: 'RECHAZADO' }
            },
            include: { equipo: true }
        });

        if (inscripciones.length < 2) {
            throw new Error('Not enough teams to generate a draw (min 2)');
        }

        // Limpiar sorteos previos (Opcional: Por ahora asumimos que si se llama es para sobrescribir o generar)
        // Cuidado: Borrar partidos existentes borraría historial. Mejor lanzar error si ya existen.
        const existingMatches = await prisma.partido.count({ where: { torneoId } });
        if (existingMatches > 0) {
            throw new Error('Draw already exists. Clear matches first (not implemented safely yet).');
        }

        if (type === 'BRACKET') {
            return this.generateBracket(torneoId, inscripciones);
        } else if (type === 'GRUPOS') {
            if (!settings?.groupsCount) throw new Error('groupsCount is required for GRUPOS');
            return this.generateGroups(torneoId, inscripciones, settings.groupsCount, settings.manualAssignments);
        }
    }

    async generateKnockoutFromGroups(torneoId: number) {
        // 1. Obtener grupos y partidos de la fase de grupos
        const matches = await prisma.partido.findMany({
            where: { torneoId: torneoId, fase: 'GRUPOS', estado: 'FINALIZADO' },
            include: { equipoLocal: true, equipoVisitante: true }
        });

        const groups = await prisma.grupo.findMany({
            where: { equipoTorneo: { torneoId: torneoId } },
            include: { equipoTorneo: { include: { equipo: true } } }
        });

        if (groups.length === 0) {
            throw new Error('No groups found for this tournament');
        }

        // 2. Calcular tabla de posiciones por grupo
        const standings: Record<string, any[]> = {};

        // Inicializar stats
        groups.forEach(g => {
            if (!standings[g.nombre]) standings[g.nombre] = [];
            // Evitar duplicados si el grupo tiene varias entradas (una por equipo)
            if (!standings[g.nombre].find(t => t.equipoId === g.equipoTorneo.equipoId)) {
                standings[g.nombre].push({
                    equipoId: g.equipoTorneo.equipoId,
                    equipo: g.equipoTorneo.equipo,
                    points: 0,
                    gf: 0,
                    gc: 0,
                    gd: 0
                });
            }
        });

        // Procesar partidos
        matches.forEach(m => {
            const team1Stats = this.findTeamStats(standings, m.equipoLocalId!);
            const team2Stats = this.findTeamStats(standings, m.equipoVisitanteId!);

            if (team1Stats && team2Stats) {
                team1Stats.gf += m.marcadorLocal || 0;
                team1Stats.gc += m.marcadorVisitante || 0;
                team1Stats.gd = team1Stats.gf - team1Stats.gc;

                team2Stats.gf += m.marcadorVisitante || 0;
                team2Stats.gc += m.marcadorLocal || 0;
                team2Stats.gd = team2Stats.gf - team2Stats.gc;

                if ((m.marcadorLocal || 0) > (m.marcadorVisitante || 0)) {
                    team1Stats.points += 3;
                } else if ((m.marcadorVisitante || 0) > (m.marcadorLocal || 0)) {
                    team2Stats.points += 3;
                } else {
                    team1Stats.points += 1;
                    team2Stats.points += 1;
                }
            }
        });

        // 3. Ordenar y seleccionar clasificados
        const qualifiedTeams: any[] = [];
        const groupNames = Object.keys(standings).sort();

        // Estrategia de cruces: 
        // Si hay 2 grupos (A, B): 1A vs 2B, 1B vs 2A -> Semis
        // Si hay 4 grupos (A, B, C, D): 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C -> Cuartos

        const firstPlace: any[] = [];
        const secondPlace: any[] = [];

        groupNames.forEach(groupName => {
            // Sort: Points DESC, GD DESC, GF DESC
            standings[groupName].sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });

            // Take top 2
            if (standings[groupName].length >= 1) firstPlace.push({ ...standings[groupName][0], group: groupName });
            if (standings[groupName].length >= 2) secondPlace.push({ ...standings[groupName][1], group: groupName });
        });

        if (firstPlace.length !== secondPlace.length) {
            // Manejar caso impar o incompleto? Por ahora asumimos estructura completa.
        }

        // Armar lista ordenada para el bracket seed
        // El metodo generateBracket recibe una lista plana. Si queremos forzar cruces, 
        // necesitamos pasarle los equipos en un orden especifico y modificar generateBracket 
        // para que NO haga shuffle si se indica.

        const seededTeams = [];
        if (groupNames.length === 2) {
            // Semis: 1A vs 2B, 1B vs 2A
            // generateBracket (reverse loop): Final (idx 0) -> Semis (idx 1)
            // En Semis (idx 1), el loop itera j=0, j=1.
            // j=0 toma teams[0] vs teams[1]
            // j=1 toma teams[2] vs teams[3]
            // Queremos:
            // Match 1: 1A (idx 0) vs 2B (idx 1)
            // Match 2: 1B (idx 2) vs 2A (idx 3)
            if (firstPlace.length >= 2 && secondPlace.length >= 2) {
                seededTeams.push(firstPlace[0]); // 1A
                seededTeams.push(secondPlace[1]); // 2B
                seededTeams.push(firstPlace[1]); // 1B
                seededTeams.push(secondPlace[0]); // 2A
            }
        } else if (groupNames.length === 4) {
            // Cuartos: 
            // 1A vs 2B
            // 1C vs 2D
            // 1B vs 2A
            // 1D vs 2C
            // Orden para generateBracket (loop j=0..3):
            // j=0: t[0] vs t[1] -> 1A vs 2B
            // j=1: t[2] vs t[3] -> 1C vs 2D
            // j=2: t[4] vs t[5] -> 1B vs 2A (o cruce opuesto para final)
            // j=3: t[6] vs t[7] -> 1D vs 2C

            // Nota: Para que 1A/2B se cruce con 1C/2D en semis, deben estar en llaves adyacentes?
            // generateBracket logic:
            // Semi 1 alimenta de Cuartos 0 y Cuartos 1.
            // Semi 2 alimenta de Cuartos 2 y Cuartos 3.
            // Entonces Ganador(1A-2B) jugará vs Ganador(1C-2D). Correcto.

            seededTeams.push(firstPlace[0]); // 1A
            seededTeams.push(secondPlace[1]); // 2B (Match 1)

            seededTeams.push(firstPlace[2]); // 1C
            seededTeams.push(secondPlace[3]); // 2D (Match 2)

            seededTeams.push(firstPlace[1]); // 1B
            seededTeams.push(secondPlace[0]); // 2A (Match 3)

            seededTeams.push(firstPlace[3]); // 1D
            seededTeams.push(secondPlace[2]); // 2C (Match 4)
        } else {
            // Fallback: Random Top 2
            seededTeams.push(...firstPlace, ...secondPlace);
        }

        // Llamar a generateBracket con flag de 'no shuffle'
        // Necesitamos modificar generateBracket para aceptar esta opción
        return this.generateBracket(torneoId, seededTeams, true);
    }

    private findTeamStats(standings: Record<string, any[]>, equipoId: number) {
        for (const group in standings) {
            const found = standings[group].find((t: any) => t.equipoId === equipoId);
            if (found) return found;
        }
        return null;
    }

    private async generateBracket(torneoId: number, teams: any[], skipShuffle: boolean = false) {
        // Shuffle only if not skipped
        const shuffled = skipShuffle ? [...teams] : [...teams].sort(() => 0.5 - Math.random());

        // Determinar fase inicial y estructura del árbol
        const count = shuffled.length;
        let phases: { name: string, matches: number }[] = [];

        if (count <= 2) {
            phases = [{ name: 'FINAL', matches: 1 }];
        } else if (count <= 4) {
            phases = [{ name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        } else if (count <= 8) {
            phases = [{ name: 'CUARTOS', matches: 4 }, { name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        } else if (count <= 16) {
            phases = [{ name: 'OCTAVOS', matches: 8 }, { name: 'CUARTOS', matches: 4 }, { name: 'SEMIFINAL', matches: 2 }, { name: 'FINAL', matches: 1 }];
        }

        const allMatches = [];
        let previousPhaseMatches: any[] = [];
        let matchCounter = 1;

        // Iterar por fases para crear partidos y enlazarlos
        // La fase 0 es la primera (ej. Octavos), la última es la Final

        // Estrategia: Crear todos los objetos de partido primero, asignando IDs temporales o manejando índices
        // Pero Prisma necesita crear para tener IDs reales si usamos autoincrement.
        // O podemos calcular índices relativos.
        // Dado que 'siguientePartidoId' es una FK a la misma tabla, necesitamos que el partido siguiente exista O
        // crear primero los finales y luego ir hacia atrás.
        // Ir hacia atrás (Final -> Semis -> Cuartos) permite tener el ID del siguiente partido.

        const reversedPhases = [...phases].reverse(); // Final, Semi, Cuartos...
        let nextRoundMatches: any[] = []; // Partidos de la ronda siguiente (ej. Final) para enlazar

        for (let i = 0; i < reversedPhases.length; i++) {
            const phase = reversedPhases[i];
            const currentRoundMatches = [];

            for (let j = 0; j < phase.matches; j++) {
                const isFinal = i === 0;
                const nextMatchIndex = Math.floor(j / 2); // 0, 1 -> 0; 2, 3 -> 1
                const nextMatchSlot = j % 2 === 0 ? 'LOCAL' : 'VISITANTE';

                const matchId = matchCounter++; // ID temporal/lógico para tracking interno si fuera necesario

                // Si es la ronda inicial (ultima en este loop invertido), asignamos equipos
                let equipoLocalId = null;
                let equipoVisitanteId = null;

                // Si estamos en la última fase del loop (que es la primera real, ej. Octavos)
                if (i === reversedPhases.length - 1) {
                    equipoLocalId = shuffled[j * 2] ? shuffled[j * 2].equipoId : null;
                    equipoVisitanteId = shuffled[j * 2 + 1] ? shuffled[j * 2 + 1].equipoId : null;
                }

                const nextMatch = nextRoundMatches.length > 0 ? nextRoundMatches[nextMatchIndex] : null;

                const partido = await prisma.partido.create({
                    data: {
                        torneoId,
                        equipoLocalId,
                        equipoVisitanteId,
                        fase: phase.name,
                        llave: `${phase.name.substring(0, 1)}${j + 1}`,
                        fechaHora: new Date(), // Placeholder
                        estado: 'PROGRAMADO',
                        siguientePartidoId: nextMatch ? nextMatch.id : null,
                        siguienteSlot: nextMatch ? nextMatchSlot : null
                    } as any
                });
                currentRoundMatches.push(partido);
                allMatches.push(partido);

                // Handle BYE (Automatic Advancement for uneven teams)
                // If there is a Local team but no Visitor, and there is a next match
                // start_lint_fix: a99338e7-a3de-4854-abf6-412d463f5aca
                if (equipoLocalId && !equipoVisitanteId && (partido as any).siguientePartidoId && (partido as any).siguienteSlot) {
                    // 1. Advance the team to the next match
                    const updateData: any = {};
                    if ((partido as any).siguienteSlot === 'LOCAL') {
                        updateData.equipoLocalId = equipoLocalId;
                    } else if ((partido as any).siguienteSlot === 'VISITANTE') {
                        updateData.equipoVisitanteId = equipoLocalId;
                    }

                    await prisma.partido.update({
                        where: { id: (partido as any).siguientePartidoId },
                        data: updateData
                    });

                    // 2. Mark current match as Finalized (Walkover)
                    // We can use a special score or just status
                    await prisma.partido.update({
                        where: { id: partido.id },
                        data: {
                            estado: 'FINALIZADO',
                            marcadorLocal: 3, // Convention for walkover? Or just keep 0-0 but winner logic handles it?
                            marcadorVisitante: 0 // Controller logic uses scores, but here we bypassed controller.
                        }
                    });
                }
            }
            nextRoundMatches = currentRoundMatches;
        }

        // Cleanup: Si había 'Bye's (equipos sin oponente en ronda 1), idealmente avanzaríamos automáticamente.
        // Por simplicidad del MVP, el admin tendrá que marcar el partido.

        // Actualizar torneo y cambiar formato a ELIMINATORIA/KNOCKOUT para que el frontend lo reconozca
        // O mantener FASE_GRUPOS pero indicar que ya hay fase final?
        // El frontend usa 'knockout' para mostrar el bracket. Si cambiamos el tipoSorteo a BRACKET, 
        // el frontend podria perder la vista de grupos si no lo manejamos bien.
        // Pero el user quiere ver ambas.
        // En TournamentDetailsModal, chequeamos 'format' (que viene de categoria o tipoSorteo).
        // Si cambiamos tipoSorteo a 'BRACKET', el modal mostrará Bracket por defecto pero tenemos pestañas.

        await prisma.torneo.update({
            where: { id: torneoId },
            data: { tipoSorteo: 'BRACKET' } as any
        });

        return { message: 'Bracket generated', matchesCreated: allMatches.length };
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
