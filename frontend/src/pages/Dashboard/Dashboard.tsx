import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Video } from 'lucide-react';
import { Box, Container, Button, Typography, Paper } from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { StatsCard } from '../../components/StatsCard';
import { TournamentCard } from '../../components/TournamentCard';
import { CreateTournamentModal } from '../../components/CreateTournamentModal';
import { TournamentDetailsModal } from '../../components/TournamentDetailsModal';
import { CreateTeamModal } from '../../components/CreateTeamModal';
import { TeamDetailsModal } from '../../components/TeamDetailsModal';
import { TeamCard } from '../../components/TeamCard';
import { MatchesSection } from '../../components/MatchesSection';
import { MatchResultModal } from '../../components/MatchResultModal';
import { StreamingSection } from '../../components/StreamingSection';
import { StandingsTable } from '../../components/StandingsTable';
import type { Tournament, Matchup, Group, Team, StreamEvent, MatchResult } from '../../types';
import { teamService, type CreateTeamDto } from '../../services/team.service';
import { tournamentService } from '../../services/tournament.service';

export const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'matches' | 'streaming' | 'standings'>('tournaments');

    const [teams, setTeams] = useState<Team[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [loadedTeams, loadedTournaments] = await Promise.all([
                teamService.getAll(),
                tournamentService.getAll()
            ]);
            setTeams(loadedTeams);
            setTournaments(loadedTournaments);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const [streams, setStreams] = useState<StreamEvent[]>([]);
    const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);
    const [isMatchResultModalOpen, setIsMatchResultModalOpen] = useState(false);
    const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<Team | null>(null);
    const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const generateKnockoutMatchups = (teamNames: string[]): Matchup[] => {
        const shuffledTeams = shuffleArray(teamNames);
        const matchups: Matchup[] = [];

        for (let i = 0; i < shuffledTeams.length; i += 2) {
            if (i + 1 < shuffledTeams.length) {
                matchups.push({
                    id: `match-${Date.now()}-${i}`,
                    team1: shuffledTeams[i],
                    team2: shuffledTeams[i + 1],
                    round: 1,
                });
            }
        }

        return matchups;
    };

    const generateGroupStageMatchups = (teamNames: string[]): { matchups: Matchup[], groups: Group[] } => {
        const shuffledTeams = shuffleArray(teamNames);
        const numGroups = Math.min(4, Math.ceil(teamNames.length / 4));
        const groups: Group[] = [];

        for (let i = 0; i < numGroups; i++) {
            groups.push({
                name: `Grupo ${String.fromCharCode(65 + i)}`,
                teams: [],
            });
        }

        shuffledTeams.forEach((team, index) => {
            groups[index % numGroups].teams.push(team);
        });

        const matchups: Matchup[] = [];
        let matchCount = 0;
        groups.forEach((group) => {
            for (let i = 0; i < group.teams.length; i++) {
                for (let j = i + 1; j < group.teams.length; j++) {
                    matchups.push({
                        id: `match-${Date.now()}-${matchCount++}`,
                        team1: group.teams[i],
                        team2: group.teams[j],
                        round: 1,
                    });
                }
            }
        });

        return { matchups, groups };
    };

    const handleCreateTournament = async (tournamentData: {
        id?: string;
        name: string;
        sport: string;
        format: 'groups' | 'knockout' | 'single-elimination';
        teams: string[];
        image?: string;
    }) => {
        try {
            if (tournamentData.id) {
                // Editing existing tournament
                // await tournamentService.update(tournamentData.id, tournamentData);
                console.log('Update not implemented in service yet');
            } else {
                // Creating new tournament
                await tournamentService.create(tournamentData);
            }
            loadData();
        } catch (error) {
            console.error('Error saving tournament', error);
        }
        setIsCreateTournamentModalOpen(false);
    };

    const handleEditTournament = (tournament: Tournament) => {
        setTournamentToEdit(tournament);
        setIsCreateTournamentModalOpen(true);
    };

    const handleDeleteTournament = async (tournament: Tournament) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el torneo "${tournament.name}"?`)) {
            try {
                // await tournamentService.delete(tournament.id);
                console.log('Delete tournament not implemented in service yet');
                // Optimistic update for now or reload
                setTournaments(tournaments.filter((t) => t.id !== tournament.id));
            } catch (error) {
                console.error('Error deleting tournament', error);
            }
        }
    };

    const handleCreateTeam = async (teamData: CreateTeamDto) => {
        try {
            // CreateTeamModal already formats the payload correctly: { nombre, facultad, logoUrl, miembros }
            // So we just pass it through.
            await teamService.create(teamData);
            loadData();
        } catch (error: any) {
            console.error('Error creating team', error.response?.data || error);
            window.alert(`Error creating team: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    };

    const handleDeleteTeam = async (teamToDelete: Team) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el equipo ${teamToDelete.name}?`)) {
            try {
                await teamService.delete(Number(teamToDelete.id)); // Ensure ID is number if needed
                loadData();
            } catch (error) {
                console.error('Error deleting team', error);
            }
        }
    };

    const handleDrawMatchups = (tournamentId: string) => {
        setTournaments(
            tournaments.map((tournament) => {
                if (tournament.id === tournamentId) {
                    let matchups: Matchup[] = [];
                    let groups: Group[] | undefined;

                    if (tournament.format === 'groups') {
                        const result = generateGroupStageMatchups(tournament.teams);
                        matchups = result.matchups;
                        groups = result.groups;
                    } else {
                        matchups = generateKnockoutMatchups(tournament.teams);
                    }

                    const updatedTournament: Tournament = {
                        ...tournament,
                        matchups,
                        groups,
                        status: 'drawn',
                        // matchups already included in spread
                    };

                    if (selectedTournament?.id === tournamentId) {
                        setSelectedTournament(updatedTournament);
                    }

                    return updatedTournament;
                }
                return tournament;
            })
        );
    };

    const handleSaveMatchResult = (matchupId: string, result: MatchResult) => {
        setTournaments(
            tournaments.map((tournament) => {
                if (tournament.matchups) {
                    const matchup = tournament.matchups.find(m => m.id === matchupId);
                    if (matchup) {
                        updateTeamStats(matchup.team1, matchup.team2, result);
                        return {
                            ...tournament,
                            matchups: tournament.matchups.map(m =>
                                m.id === matchupId ? { ...m, result } : m
                            ),
                        };
                    }
                }
                return tournament;
            })
        );
    };

    const updateTeamStats = (team1Name: string, team2Name: string, result: MatchResult) => {
        setTeams(teams.map(team => {
            if (team.name === team1Name) {
                const isWin = result.team1Score > result.team2Score;
                const isDraw = result.team1Score === result.team2Score;
                const isLoss = result.team1Score < result.team2Score;

                return {
                    ...team,
                    wins: (team.wins || 0) + (isWin ? 1 : 0),
                    draws: (team.draws || 0) + (isDraw ? 1 : 0),
                    losses: (team.losses || 0) + (isLoss ? 1 : 0),
                    goalsFor: (team.goalsFor || 0) + result.team1Score,
                    goalsAgainst: (team.goalsAgainst || 0) + result.team2Score,
                };
            }

            if (team.name === team2Name) {
                const isWin = result.team2Score > result.team1Score;
                const isDraw = result.team1Score === result.team2Score;
                const isLoss = result.team2Score < result.team1Score;

                return {
                    ...team,
                    wins: (team.wins || 0) + (isWin ? 1 : 0),
                    draws: (team.draws || 0) + (isDraw ? 1 : 0),
                    losses: (team.losses || 0) + (isLoss ? 1 : 0),
                    goalsFor: (team.goalsFor || 0) + result.team2Score,
                    goalsAgainst: (team.goalsAgainst || 0) + result.team1Score,
                };
            }

            return team;
        }));
    };

    const handleEditMatchResult = (matchup: Matchup) => {
        setSelectedMatchup(matchup);
        setIsMatchResultModalOpen(true);
    };

    const handleCreateStream = (streamData: StreamEvent | Omit<StreamEvent, 'id'>) => {
        if ('id' in streamData && streamData.id) {
            // Edit existing
            setStreams(prevStreams =>
                prevStreams.map(s => s.id === streamData.id ? { ...s, ...streamData } as StreamEvent : s)
            );
        } else {
            // Create new
            const newStream: StreamEvent = {
                id: Date.now().toString(),
                ...streamData,
            } as StreamEvent;
            setStreams(prevStreams => [newStream, ...prevStreams]);
        }
    };

    const handleDeleteStream = (streamId: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta transmisión?')) {
            setStreams(streams.filter(s => s.id !== streamId));
        }
    };

    const allMatchups = tournaments.flatMap(t => t.matchups || []);
    const playedMatches = allMatchups.filter(m => m.result?.played).length;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as any)}
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Stats Section */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    mb: 4
                }}>
                    <StatsCard
                        title="Total Torneos"
                        value={tournaments.length}
                        icon={Trophy}
                        color="primary"
                    />
                    <StatsCard
                        title="Equipos Registrados"
                        value={teams.length}
                        icon={Users}
                        color="secondary"
                    />
                    <StatsCard
                        title="Partidos Jugados"
                        value={playedMatches}
                        icon={Calendar}
                        color="success"
                    />
                    <StatsCard
                        title="Transmisiones"
                        value={streams.length}
                        icon={Video}
                        color="error"
                    />
                </Box>

                {/* Tab Content */}
                {activeTab === 'tournaments' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                                Torneos
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={() => setIsCreateTournamentModalOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1.5,
                                }}
                            >
                                Crear Torneo
                            </Button>
                        </Box>

                        {tournaments.length === 0 ? (
                            <Paper sx={{ textAlign: 'center', py: 12, bgcolor: 'transparent', boxShadow: 'none' }}>
                                <TrophyIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No hay torneos creados
                                </Typography>
                            </Paper>
                        ) : (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: 3
                            }}>
                                {tournaments.map((tournament) => (
                                    <TournamentCard
                                        key={tournament.id}
                                        tournament={tournament}
                                        onViewDetails={setSelectedTournament}
                                        onEdit={handleEditTournament}
                                        onDelete={handleDeleteTournament}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 'teams' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                                Equipos
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={() => setIsCreateTeamModalOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1.5,
                                }}
                            >
                                Crear Equipo
                            </Button>
                        </Box>

                        {teams.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 12 }}>
                                <GroupIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No hay equipos registrados
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                                gap: 3
                            }}>
                                {teams.map((team) => (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        onViewDetails={setSelectedTeamForDetails}
                                        onDelete={handleDeleteTeam}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 'matches' && (
                    <MatchesSection
                        matchups={allMatchups}
                        onEditResult={handleEditMatchResult}
                    />
                )}

                {activeTab === 'streaming' && (
                    <StreamingSection
                        streams={streams}
                        matchups={allMatchups.filter(m => !m.result?.played)}
                        teams={teams}
                        onCreateStream={handleCreateStream}
                        onDeleteStream={handleDeleteStream}
                    />
                )}

                {activeTab === 'standings' && (
                    <Box>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Tabla de Posiciones
                        </Typography>
                        <StandingsTable teams={teams} />
                    </Box>
                )}
            </Container>

            {/* Modals */}
            <CreateTournamentModal
                isOpen={isCreateTournamentModalOpen}
                onClose={() => {
                    setIsCreateTournamentModalOpen(false);
                    setTournamentToEdit(null);
                }}
                teams={teams}
                tournamentToEdit={tournamentToEdit}
                onCreateTournament={handleCreateTournament}
            />

            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                onCreateTeam={handleCreateTeam}
            />

            <TeamDetailsModal
                team={selectedTeamForDetails}
                onClose={() => setSelectedTeamForDetails(null)}
            />

            <TournamentDetailsModal
                tournament={selectedTournament}
                onClose={() => setSelectedTournament(null)}
                onDrawMatchups={handleDrawMatchups}
            />

            <MatchResultModal
                isOpen={isMatchResultModalOpen}
                matchup={selectedMatchup}
                onClose={() => {
                    setIsMatchResultModalOpen(false);
                    setSelectedMatchup(null);
                }}
                onSaveResult={handleSaveMatchResult}
            />
        </Box>
    );
}
