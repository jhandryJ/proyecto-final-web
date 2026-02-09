import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Video } from 'lucide-react';
import { Box, Container, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
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
import { PaymentValidation } from '../../components/PaymentValidation';
import type { Tournament, Matchup, Team, StreamEvent, MatchResult } from '../../types';
import { teamsService } from '../../services/teams.service';
import { tournamentsService } from '../../services/tournaments.service';
import { matchesService } from '../../services/matches.service';
import { streamingService } from '../../services/streaming.service';
import { usersService, type Usuario } from '../../services/users.service';
import { UsersTable } from '../../components/UsersTable';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'matches' | 'streaming' | 'standings' | 'payments' | 'users'>('tournaments');

    const [teams, setTeams] = useState<Team[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [users, setUsers] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [streams, setStreams] = useState<StreamEvent[]>([]);
    const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);
    const [isMatchResultModalOpen, setIsMatchResultModalOpen] = useState(false);
    const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<Team | null>(null);
    const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [teamsData, campeonatosData, streamsData, usersData] = await Promise.all([
                teamsService.getAll(),
                tournamentsService.getCampeonatos(),
                streamingService.getStreams(),
                usersService.getAll()
            ]);

            // Map Backend Teams to Frontend Teams
            const mappedTeams: any[] = teamsData.map(t => ({
                id: t.id,
                nombre: t.nombre,
                name: t.nombre,
                sport: t.disciplina || t.facultad || 'General',
                facultad: t.facultad,
                disciplina: t.disciplina,
                logoUrl: t.logoUrl,
                color: t.logoUrl || '#1976d2',
                capitanId: t.capitanId,
                capitan: t.capitan as any,
                miembros: t.miembros, // Keep original
                wins: 0,
                losses: 0,
                draws: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                createdAt: new Date()
            }));

            // Map Backend Campeonatos/Torneos to Frontend Tournaments
            // Flatten tournaments from championships
            const mappedTournaments: Tournament[] = [];

            // Iterate championships and tournaments to flatten
            for (const c of campeonatosData) {
                if (c.torneos) {
                    for (const t of c.torneos) {
                        // Load matches for each tournament
                        let matchups: Matchup[] = [];
                        try {
                            const partidos = await matchesService.getByTournament(t.id);
                            matchups = partidos.map(p => ({
                                id: p.id,
                                team1: p.equipoLocal?.nombre || 'TBD',
                                team2: p.equipoVisitante?.nombre || 'TBD',
                                round: 1, // Defaulting round as backend 'fase' might be string
                                result: {
                                    team1Score: p.marcadorLocal || 0,
                                    team2Score: p.marcadorVisitante || 0,
                                    played: p.estado === 'FINALIZADO',
                                    date: new Date(p.fechaHora)
                                },
                                fechaHora: new Date(p.fechaHora),
                                estado: p.estado,
                                scheduledDate: new Date(p.fechaHora),
                                torneoId: t.id // Add reference to tournament
                            }));
                        } catch (e) {
                            console.warn(`Could not load matches for tournament ${t.id}`, e);
                        }

                        mappedTournaments.push({
                            id: t.id,
                            campeonatoId: t.campeonatoId,
                            disciplina: t.disciplina,
                            categoria: t.categoria,
                            genero: t.genero || 'MIXTO',
                            name: `${c.nombre} - ${t.categoria}`,
                            sport: t.disciplina,
                            format: (t.tipoSorteo === 'GRUPOS' || t.tipoSorteo === 'grupos') ? 'groups' : ((t.tipoSorteo?.toLowerCase() as any) || 'knockout'),
                            teams: t.inscripciones?.map((i: any) => i.equipo.nombre) || [],
                            teamDetails: t.inscripciones?.map((i: any) => ({ id: i.equipoId, name: i.equipo.nombre })) || [],
                            status: matchups.length > 0 ? 'drawn' : 'pending',
                            createdAt: new Date(c.fechaInicio),
                            image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop',
                            matchups: matchups
                        });
                    }
                }
            }

            setTeams(mappedTeams);
            setTournaments(mappedTournaments);
            setTeams(mappedTeams);
            setTournaments(mappedTournaments);
            setStreams(streamsData);
            setUsers(usersData);
            return mappedTournaments;
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Error al cargar datos del dashboard. Verifique su conexión.');
            return [];
        } finally {
            setIsLoading(false);
        }
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
            if (tournamentData.id && tournamentToEdit) {
                // Map frontend format to backend categoria
                let categoria: 'ELIMINATORIA' | 'FASE_GRUPOS' | 'TODOS_CONTRA_TODOS';
                switch (tournamentData.format) {
                    case 'groups':
                        categoria = 'FASE_GRUPOS';
                        break;
                    case 'knockout':
                    case 'single-elimination':
                        categoria = 'ELIMINATORIA';
                        break;
                    default:
                        categoria = 'ELIMINATORIA';
                }

                // Update Championship
                const data = tournamentData as any;
                if (tournamentToEdit.campeonatoId) {
                    await tournamentsService.updateCampeonato(tournamentToEdit.campeonatoId, {
                        nombre: data.championshipName || tournamentData.name,
                        anio: data.year || new Date().getFullYear(),
                        fechaInicio: data.startDate,
                        fechaFin: data.endDate
                    });
                }

                // Update Tournament
                await tournamentsService.updateTorneo(parseInt(tournamentData.id), {
                    disciplina: tournamentData.sport,
                    categoria: categoria,
                    genero: data.genero || 'MIXTO'
                });

                // Update team registrations
                if (tournamentData.teams && tournamentData.teams.length > 0) {
                    await Promise.all(tournamentData.teams.map(async (teamId) => {
                        try {
                            await tournamentsService.registerTeam(parseInt(tournamentData.id!), parseInt(teamId));
                        } catch (e: any) {
                            // Ignore if already registered (409) to avoid console errors
                            if (e.response && e.response.status !== 409) {
                                console.error(`Error registering team ${teamId}:`, e);
                            }
                        }
                    }));
                }

                alert('Torneo actualizado exitosamente');
                await loadData();
            } else {
                // Get categoria directly from tournamentData (already in correct format from modal)
                const data = tournamentData as any;
                const categoria = data.categoria || 'ELIMINATORIA';

                // Let's create a championship first (Quick fix for functionality)
                const camp = await tournamentsService.createCampeonato({
                    nombre: data.championshipName || tournamentData.name,
                    anio: data.year || new Date().getFullYear(),
                    fechaInicio: data.startDate || new Date().toISOString(),
                    fechaFin: data.endDate
                });

                const torneo = await tournamentsService.createTorneo({
                    campeonatoId: camp.id,
                    disciplina: data.disciplina || tournamentData.sport,
                    categoria: categoria,
                    genero: data.genero || 'MIXTO',
                    costoInscripcion: data.costoInscripcion
                });

                // Register selected teams
                if (tournamentData.teams && tournamentData.teams.length > 0) {
                    await Promise.all(tournamentData.teams.map(async (teamId) => {
                        try {
                            await tournamentsService.registerTeam(torneo.id, parseInt(teamId));
                        } catch (e: any) {
                            if (e.response && e.response.status !== 409) {
                                console.error(`Error registering team ${teamId}:`, e);
                            }
                        }
                    }));
                }

                await loadData(); // Reload all data
            }
            setIsCreateTournamentModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Error al crear torneo');
        }
    };

    const handleEditTournament = (tournament: Tournament) => {
        setTournamentToEdit(tournament);
        setIsCreateTournamentModalOpen(true);
    };

    const handleDeleteTournament = async (tournament: Tournament) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el torneo "${tournament.name}"?`)) {
            try {
                // Assuming ID matches Torneo ID
                await tournamentsService.deleteTorneo(tournament.id);
                alert('Torneo eliminado exitosamente');
                await loadData();
            } catch (err: any) {
                console.error(err);
                const errorMessage = err.response?.data?.message || 'Error al eliminar torneo';
                alert(errorMessage);
            }
        }
    };

    const handleViewBracket = (tournament: Tournament) => {
        navigate(`/dashboard/torneos/${tournament.id}/bracket`);
    };

    const handleCreateOrUpdateTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
        try {
            const payload: any = {
                nombre: teamData.nombre || teamData.name,
                facultad: teamData.facultad || teamData.sport,
                disciplina: teamData.disciplina
            };

            // Add logoUrl if provided
            if (teamData.logoUrl) {
                payload.logoUrl = teamData.logoUrl;
            }

            // Add captainId if provided (admin feature)
            if (teamData.captainId || teamData.capitanId) {
                payload.capitanId = teamData.capitanId || teamData.captainId;
            }

            if (teamToEdit) {
                // Update
                await teamsService.update(teamToEdit.id, payload); // Ensure ID is correct
                alert('Equipo actualizado exitosamente');
            } else {
                // Create
                await teamsService.create(payload);
                alert('Equipo creado exitosamente');
            }

            await loadData();
            setIsCreateTeamModalOpen(false);
            setTeamToEdit(null); // Reset
        } catch (err: any) {
            console.error('Error saving team:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al guardar equipo';
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleViewTeamDetails = async (team: Team) => {
        try {
            setIsLoading(true);
            const detailedTeam = await teamsService.getById(team.id);
            setSelectedTeamForDetails({
                ...team,
                ...detailedTeam,
                id: team.id, // Keep string ID if needed by UI
                miembros: detailedTeam.miembros
            });
        } catch (err) {
            console.error('Error fetching team details:', err);
            alert('Error al cargar detalles del equipo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditTeam = (team: Team) => {
        setTeamToEdit(team);
        setIsCreateTeamModalOpen(true);
    };

    const handleDeleteTeam = async (teamToDelete: Team) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el equipo ${teamToDelete.name}?`)) {
            try {
                await teamsService.delete(teamToDelete.id);
                await loadData();
            } catch (err) {
                console.error(err);
                alert('Error al eliminar equipo');
            }
        }
    };

    const handleDrawMatchups = async (tournamentId: number, settings?: any) => {
        try {
            const tournament = tournaments.find(t => t.id === tournamentId);
            if (!tournament) return;

            // Call API to generate draw
            await tournamentsService.generateDraw(tournamentId, {
                type: tournament.format === 'groups' ? 'GRUPOS' : 'BRACKET',
                settings: settings || (tournament.format === 'groups' ? { groupsCount: 2 } : undefined)
            });

            alert('Sorteo generado exitosamente');
            const updatedTournaments = await loadData(); // Reload to get match updates

            // Refresh selected tournament
            if (selectedTournament && selectedTournament.id === tournamentId) {
                const updated = updatedTournaments.find(t => t.id === tournamentId);
                if (updated) setSelectedTournament(updated);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error al generar sorteo');
        }
    };

    const handlePromoteToKnockout = async (tournamentId: number) => {
        try {
            await tournamentsService.promoteToKnockout(tournamentId);
            alert('Equipos promovidos y fase final generada exitosamente');
            const updatedTournaments = await loadData(); // Reload to get new bracket matches

            // Refresh selected tournament
            if (selectedTournament && selectedTournament.id === tournamentId) {
                const updated = updatedTournaments.find(t => t.id === tournamentId);
                if (updated) setSelectedTournament(updated);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error al promover equipos');
        }
    };


    const handleSaveMatchResult = async (matchupId: number, result: MatchResult) => {
        try {
            await matchesService.updateResult(matchupId, {
                marcadorLocal: result.team1Score,
                marcadorVisitante: result.team2Score,
                estado: 'FINALIZADO'
            });
            await loadData(); // Reload to update standings and brackets
        } catch (err) {
            console.error(err);
            alert('Error al actualizar resultado del partido');
        }
    };

    const handleEditMatchResult = (matchup: Matchup) => {
        setSelectedMatchup(matchup);
        setIsMatchResultModalOpen(true);
    };

    const handleCreateStream = async (streamData: StreamEvent | Omit<StreamEvent, 'id'>) => {
        try {
            if ('id' in streamData && streamData.id) {
                // Edit existing (Not implemented in backend yet, so just alert or simple update logic if needed)
                alert('La edición de streams aún no está implementada en el backend.');
            } else {
                // Create new
                // We need to extract the partidoId from the matchup.id (which assumes it is the partidoId stringified)
                const partidoId = streamData.matchup.id;
                if (isNaN(partidoId)) {
                    alert('Error: ID del partido inválido');
                    return;
                }

                await streamingService.createStream({
                    partidoId: partidoId,
                    url: streamData.streamUrl,
                    isLive: streamData.status === 'live'
                });
                await loadData(); // Reload to show new stream
                alert('Transmisión creada exitosamente');
            }
        } catch (error) {
            console.error('Error dealing with stream:', error);
            alert('Error al guardar la transmisión');
        }
    };

    const handleUpdateStreamStatus = async (streamId: number, isLive: boolean) => {
        try {
            await streamingService.updateStreamStatus(streamId, isLive);
            await loadData();
        } catch (error) {
            console.error('Error updating stream status:', error);
            alert('Error al actualizar el estado de la transmisión');
        }
    };

    const handleDeleteStream = async (streamId: number) => {
        if (window.confirm('¿Estás seguro de eliminar esta transmisión?')) {
            try {
                await streamingService.deleteStream(streamId);
                await loadData();
            } catch (error) {
                console.error('Error deleting stream:', error);
                alert('Error al eliminar la transmisión');
            }
        }
    };

    const allMatchups = tournaments.flatMap(t => t.matchups || []);
    const playedMatches = allMatchups.filter(m => m.result?.played).length;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9' }}>
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as any)}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <CircularProgress />
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
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
                {activeTab === 'users' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                                Gestión de Usuarios
                            </Typography>
                        </Box>
                        <UsersTable users={users} />
                    </Box>
                )}

                {activeTab === 'tournaments' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                                Gestión de Torneos
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={() => setIsCreateTournamentModalOpen(true)}
                                sx={{
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                    px: 4,
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #001F52 0%, #004B9B 100%)',
                                    boxShadow: '0 4px 12px rgba(0, 31, 82, 0.2)',
                                    fontWeight: 800,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #001538 0%, #003366 100%)',
                                        boxShadow: '0 6px 16px rgba(0, 31, 82, 0.3)',
                                    }
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
                                        onViewBracket={handleViewBracket}
                                        onEdit={handleEditTournament}
                                        onDelete={handleDeleteTournament}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )
                }

                {
                    activeTab === 'teams' && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                                    Gestión de Equipos
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsCreateTeamModalOpen(true)}
                                    sx={{
                                        borderRadius: 1.5,
                                        textTransform: 'none',
                                        px: 4,
                                        py: 1.5,
                                        background: 'linear-gradient(135deg, #001F52 0%, #004B9B 100%)',
                                        boxShadow: '0 4px 12px rgba(0, 31, 82, 0.2)',
                                        fontWeight: 800
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
                                            onViewDetails={() => handleViewTeamDetails(team)}
                                            onDelete={handleDeleteTeam}
                                            onEdit={handleEditTeam}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )
                }

                {
                    activeTab === 'matches' && (
                        <MatchesSection
                            matchups={allMatchups}
                            tournaments={tournaments}
                            onEditResult={handleEditMatchResult}
                        />
                    )
                }

                {
                    activeTab === 'streaming' && (
                        <StreamingSection
                            streams={streams}
                            matchups={allMatchups.filter(m => !m.result?.played)}
                            teams={teams}
                            onCreateStream={handleCreateStream}
                            onDeleteStream={handleDeleteStream}
                            onUpdateStatus={handleUpdateStreamStatus}
                        />
                    )
                }

                {
                    activeTab === 'standings' && (
                        <Box>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Tabla de Posiciones
                            </Typography>
                            <StandingsTable tournaments={tournaments} />
                        </Box>
                    )
                }

                {
                    activeTab === 'payments' && (
                        // Optional: Add isAdmin check here too for safety, though Sidebar hides it
                        <PaymentValidation
                            onSuccess={loadData}
                        />
                    )
                }
            </Container >

            {/* Modals */}
            < CreateTournamentModal
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
                onClose={() => {
                    setIsCreateTeamModalOpen(false);
                    setTeamToEdit(null);
                }}
                onCreateTeam={handleCreateOrUpdateTeam}
                teamToEdit={teamToEdit}
            />

            <TeamDetailsModal
                team={selectedTeamForDetails}
                onClose={() => setSelectedTeamForDetails(null)}
            />

            <TournamentDetailsModal
                tournament={selectedTournament}
                onClose={() => setSelectedTournament(null)}
                onDrawMatchups={handleDrawMatchups}
                onPromoteToKnockout={handlePromoteToKnockout}
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
        </Box >
    );
}
