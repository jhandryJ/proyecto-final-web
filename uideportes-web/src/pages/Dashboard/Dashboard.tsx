import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Video } from 'lucide-react';
import { Box, Container, Button, Typography, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    Add as AddIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { StatsCard } from '../../components/StatsCard';
import { ChampionshipCard } from '../../components/ChampionshipCard';
import { CreateTournamentModal } from '../../components/CreateTournamentModal';
import { TournamentDetailsModal } from '../../components/TournamentDetailsModal';
import { CreateTeamModal } from '../../components/CreateTeamModal';
import { TeamDetailsModal } from '../../components/TeamDetailsModal';
import { TeamCard } from '../../components/TeamCard';
import { StreamingSection } from '../../components/StreamingSection';
import { StandingsTable } from '../../components/StandingsTable';
import { UpdateMatchModal } from '../../components/UpdateMatchModal';
import { MatchesSection } from '../../components/MatchesSection';
import { MatchResultModal } from '../../components/MatchResultModal';
import { resourcesService } from '../../services/resources.service';
import { PaymentValidation } from '../../components/PaymentValidation';
import type { Tournament, Matchup, Team, StreamEvent, MatchResult, Championship, Cancha } from '../../types';
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
    const [championships, setChampionships] = useState<Championship[]>([]);
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
    const [isUpdateMatchModalOpen, setIsUpdateMatchModalOpen] = useState(false);
    const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<Matchup | null>(null);
    const [venues, setVenues] = useState<Cancha[]>([]);
    const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
    const [genderFilter, setGenderFilter] = useState<string>('all');


    useEffect(() => {
        loadData();
    }, []);

    const handleEditMatchSchedule = (matchup: Matchup) => {
        setSelectedMatchForEdit(matchup);
        setIsUpdateMatchModalOpen(true);
    };

    const handleSaveMatchSchedule = async (matchId: number, data: { fechaHora?: Date, canchaId?: number }) => {
        try {
            await matchesService.updateResult(matchId, {
                fechaHora: data.fechaHora,
                canchaId: data.canchaId
            });
            alert('Partido programado exitosamente');
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Error al programar el partido');
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [teamsData, campeonatosData, streamsData, usersData, canchasData] = await Promise.all([
                teamsService.getAll(),
                tournamentsService.getCampeonatos(),
                streamingService.getStreams(),
                usersService.getAll(),
                resourcesService.getAllCanchas()
            ]);

            setVenues(canchasData);

            // Map Backend Teams to Frontend Teams
            const mappedTeams: any[] = teamsData.map(t => ({
                id: t.id,
                nombre: t.nombre,
                name: t.nombre,
                sport: t.disciplina || t.facultad || 'General',
                facultad: t.facultad,
                disciplina: t.disciplina,
                genero: t.genero,
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

            // Map Backend Campeonatos/Torneos to Frontend Tournaments and Championships
            const mappedChampionships: Championship[] = [];
            const allTournaments: Tournament[] = [];

            for (const c of campeonatosData) {
                const championshipTournaments: Tournament[] = [];

                if (c.torneos) {
                    for (const t of c.torneos) {
                        try {
                            const partidos = await matchesService.getByTournament(t.id);
                            const matchups = partidos.map(p => ({
                                id: p.id,
                                team1: p.equipoLocal?.nombre || 'TBD',
                                team2: p.equipoVisitante?.nombre || 'TBD',
                                // round: 1, // Removed to allow BracketView to calculate from fase
                                fase: p.fase, // Added fase
                                result: {
                                    team1Score: p.marcadorLocal || 0,
                                    team2Score: p.marcadorVisitante || 0,
                                    played: p.estado === 'FINALIZADO',
                                    date: new Date(p.fechaHora)
                                },
                                fechaHora: new Date(p.fechaHora),
                                estado: p.estado,
                                scheduledDate: new Date(p.fechaHora),
                                torneoId: t.id,
                                llave: p.llave
                            }));

                            const mappedTournament: Tournament & { championshipName: string } = {
                                id: t.id,
                                campeonatoId: t.campeonatoId,
                                disciplina: t.disciplina,
                                categoria: t.categoria,
                                genero: t.genero || 'MIXTO',
                                name: `${c.nombre} - ${t.disciplina} ${t.genero || 'MIXTO'} (${t.categoria})`,
                                championshipName: c.nombre, // Store the original base name
                                sport: t.disciplina,
                                format: (t.tipoSorteo === 'GRUPOS' || t.tipoSorteo === 'grupos') ? 'groups' : 'knockout',
                                teams: t.inscripciones?.map((i: any) => i.equipo.nombre) || [],
                                teamDetails: t.inscripciones?.map((i: any) => ({ id: i.equipoId, name: i.equipo.nombre })) || [],
                                status: matchups.length > 0 ? 'drawn' : 'pending',
                                createdAt: new Date(c.fechaInicio),
                                image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop',
                                matchups: matchups,
                                costoInscripcion: t.costoInscripcion,
                                campeonato: c
                            } as any;

                            championshipTournaments.push(mappedTournament);
                            allTournaments.push(mappedTournament);
                        } catch (e) {
                            console.warn(`No se pudieron cargar partidos para el torneo ${t.id}`, e);
                        }
                    }
                }

                mappedChampionships.push({
                    ...c,
                    fechaInicio: new Date(c.fechaInicio),
                    fechaFin: c.fechaFin ? new Date(c.fechaFin) : undefined,
                    torneos: championshipTournaments
                });
            }

            setTeams(mappedTeams);
            setTournaments(allTournaments);
            setChampionships(mappedChampionships);
            setStreams(streamsData);
            setUsers(usersData);
            return allTournaments;
        } catch (err) {
            console.error('Error al cargar datos del dashboard:', err);
            setError('Error al cargar datos del dashboard. Verifique su conexión.');
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTournament = async (tournamentData: unknown) => {
        const data = tournamentData as any;
        try {
            if (data.id && tournamentToEdit) {
                // Modo Edición
                let categoria: 'ELIMINATORIA' | 'FASE_GRUPOS' | 'TODOS_CONTRA_TODOS';
                switch (data.format) {
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

                if (tournamentToEdit.campeonatoId) {
                    await tournamentsService.updateCampeonato(tournamentToEdit.campeonatoId, {
                        nombre: data.championshipName || data.name,
                        anio: data.year || new Date().getFullYear(),
                        fechaInicio: data.startDate,
                        fechaFin: data.endDate
                    });
                }

                await tournamentsService.updateTorneo(parseInt(data.id), {
                    disciplina: data.sport || data.disciplina,
                    categoria: categoria,
                    genero: data.genero || 'MIXTO',
                    costoInscripcion: data.costoInscripcion
                });

                if (data.teams && Array.isArray(data.teams)) {
                    // Only register teams that are NOT already in the tournament
                    const currentTeamIds = (tournamentToEdit.teamDetails || []).map(t => t.id.toString());
                    const newTeams = data.teams.filter((id: string) => !currentTeamIds.includes(id));

                    if (newTeams.length > 0) {
                        await Promise.all(newTeams.map(async (teamId: string) => {
                            try {
                                await tournamentsService.registerTeam(parseInt(data.id!), parseInt(teamId));
                            } catch (e: any) {
                                if (e.response && e.response.status !== 409) {
                                    console.error(`Error al registrar equipo ${teamId}:`, e);
                                }
                            }
                        }));
                    }
                }

                alert('Torneo actualizado exitosamente');
                await loadData();
            } else {
                await tournamentsService.createCampeonato(data);
                alert('Campeonato y torneos creados exitosamente');
                await loadData();
            }
            setIsCreateTournamentModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Error al procesar el torneo');
        }
    };

    const handleEditTournament = (tournament: Tournament) => {
        setTournamentToEdit(tournament);
        setIsCreateTournamentModalOpen(true);
    };

    const handleDeleteTournament = async (tournament: Tournament) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el torneo "${tournament.name}"?`)) {
            try {
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

    // NEW Handlers
    const handleDeleteChampionship = async (championship: Championship) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el campeonato "${championship.nombre}"? Esto eliminará todos sus torneos asociados.`)) {
            try {
                await tournamentsService.deleteCampeonato(championship.id);
                alert('Campeonato eliminado exitosamente');
                await loadData();
            } catch (err: any) {
                console.error(err);
                alert('Error al eliminar campeonato');
            }
        }
    };

    const handleEditChampionship = (_championship: Championship) => {
        alert("Para editar un campeonato, por favor edite sus torneos individuales o cree uno nuevo.");
    };

    const handleViewBracket = (tournament: Tournament) => {
        navigate(`/dashboard/torneos/${tournament.id}/bracket`);
    };

    const handleCreateOrUpdateTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
        try {
            const payload: any = {
                nombre: teamData.nombre,
                facultad: teamData.facultad,
                disciplina: teamData.disciplina,
                genero: teamData.genero,
                logoUrl: teamData.logoUrl || undefined,
                codigoAcceso: teamData.codigoAcceso || undefined,
                capitanId: teamData.capitanId ? Number(teamData.capitanId) : undefined
            };

            if (teamToEdit) {
                await teamsService.update(teamToEdit.id, payload);
                alert('Equipo actualizado exitosamente');
            } else {
                await teamsService.create(payload);
                alert('Equipo creado exitosamente');
            }
            await loadData();
            setIsCreateTeamModalOpen(false);
            setTeamToEdit(null);
        } catch (err: any) {
            console.error('Error al guardar equipo:', err);
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
                id: team.id,
                miembros: detailedTeam.miembros
            });
        } catch (err) {
            console.error('Error al obtener detalles del equipo:', err);
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
            await tournamentsService.generateDraw(tournamentId, {
                type: tournament.format === 'groups' ? 'GRUPOS' : 'BRACKET',
                settings: settings || (tournament.format === 'groups' ? { groupsCount: 2 } : undefined)
            });
            alert('Sorteo generado exitosamente');
            const updatedTournaments = await loadData();
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
            const updatedTournaments = await loadData();
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
            await loadData();
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
                alert('La edición de streams aún no está implementada en el backend.');
            } else {
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
                await loadData();
                alert('Transmisión creada exitosamente');
            }
        } catch (error) {
            console.error('Error al procesar transmisión:', error);
            alert('Error al guardar la transmisión');
        }
    };

    const handleUpdateStreamStatus = async (streamId: number, isLive: boolean) => {
        try {
            await streamingService.updateStreamStatus(streamId, isLive);
            await loadData();
        } catch (error) {
            console.error('Error al actualizar estado de transmisión:', error);
            alert('Error al actualizar el estado de la transmisión');
        }
    };

    const handleDeleteStream = async (streamId: number) => {
        if (window.confirm('¿Estás seguro de eliminar esta transmisión?')) {
            try {
                await streamingService.deleteStream(streamId);
                await loadData();
            } catch (error) {
                console.error('Error al eliminar transmisión:', error);
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
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={loadData}
                                sx={{ color: '#001F52' }}
                            >
                                Actualizar
                            </Button>
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
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    startIcon={<RefreshIcon />}
                                    onClick={loadData}
                                    sx={{ color: '#001F52' }}
                                >
                                    Actualizar
                                </Button>
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
                        </Box>

                        {championships.length === 0 ? (
                            <Paper sx={{ textAlign: 'center', py: 12, bgcolor: 'transparent', boxShadow: 'none' }}>
                                <TrophyIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No hay campeonatos creados
                                </Typography>
                            </Paper>
                        ) : (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                                gap: 3
                            }}>
                                {championships.map((championship) => (
                                    <ChampionshipCard
                                        key={championship.id}
                                        championship={championship}
                                        onViewTournament={setSelectedTournament}
                                        onViewBracket={handleViewBracket}
                                        onEdit={handleEditChampionship}
                                        onDelete={handleDeleteChampionship}
                                        onEditTournament={handleEditTournament}
                                        onDeleteTournament={handleDeleteTournament}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 'teams' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                                Gestión de Equipos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    startIcon={<RefreshIcon />}
                                    onClick={loadData}
                                    sx={{ color: '#001F52' }}
                                >
                                    Actualizar
                                </Button>
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
                        </Box>

                        {/* Filters */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Disciplina</InputLabel>
                                <Select
                                    value={disciplineFilter}
                                    label="Disciplina"
                                    onChange={(e) => setDisciplineFilter(e.target.value)}
                                >
                                    <MenuItem value="all">Todas</MenuItem>
                                    <MenuItem value="FUTBOL">Fútbol</MenuItem>
                                    <MenuItem value="BASKET">Baloncesto</MenuItem>
                                    <MenuItem value="ECUAVOLEY">Ecuavóley</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Género</InputLabel>
                                <Select
                                    value={genderFilter}
                                    label="Género"
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                                    <MenuItem value="FEMENINO">Femenino</MenuItem>
                                    <MenuItem value="MIXTO">Mixto</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {teams.filter(team => {
                            const matchesDiscipline = disciplineFilter === 'all' || team.disciplina === disciplineFilter;
                            const matchesGender = genderFilter === 'all' || team.genero === genderFilter;
                            return matchesDiscipline && matchesGender;
                        }).length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 12 }}>
                                <GroupIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No hay equipos registrados
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 3
                            }}>
                                {teams.filter(team => {
                                    const matchesDiscipline = disciplineFilter === 'all' || team.disciplina === disciplineFilter;
                                    const matchesGender = genderFilter === 'all' || team.genero === genderFilter;
                                    return matchesDiscipline && matchesGender;
                                }).map((team) => (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        onViewDetails={handleViewTeamDetails}
                                        onEdit={handleEditTeam}
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
                        tournaments={tournaments}
                        onEditResult={handleEditMatchResult}
                        onScheduleMatch={handleEditMatchSchedule}
                    />
                )}

                {activeTab === 'streaming' && (
                    <StreamingSection
                        streams={streams}
                        matchups={allMatchups}
                        teams={teams}
                        onCreateStream={handleCreateStream}
                        onUpdateStatus={handleUpdateStreamStatus}
                        onDeleteStream={handleDeleteStream}
                    />
                )}

                {activeTab === 'standings' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                                Tabla de Posiciones
                            </Typography>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={loadData}
                                sx={{ color: '#001F52' }}
                            >
                                Actualizar
                            </Button>
                        </Box>
                        <StandingsTable tournaments={tournaments} />
                    </Box>
                )}

                {activeTab === 'payments' && (
                    <PaymentValidation />
                )}
            </Container>

            {/* Modals */}
            <CreateTournamentModal
                isOpen={isCreateTournamentModalOpen}
                onClose={() => {
                    setIsCreateTournamentModalOpen(false);
                    setTournamentToEdit(null);
                }}
                onCreateTournament={handleCreateTournament}
                tournamentToEdit={tournamentToEdit}
                teams={teams}
            />

            <TournamentDetailsModal
                onClose={() => setSelectedTournament(null)}
                tournament={selectedTournament}
                onDrawMatchups={handleDrawMatchups}
                onPromoteToKnockout={handlePromoteToKnockout}
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
                onClose={() => setSelectedTeamForDetails(null)}
                team={selectedTeamForDetails}
            />

            <MatchResultModal
                isOpen={isMatchResultModalOpen}
                onClose={() => setIsMatchResultModalOpen(false)}
                matchup={selectedMatchup}
                onSaveResult={handleSaveMatchResult}
            />

            <UpdateMatchModal
                open={isUpdateMatchModalOpen}
                onClose={() => setIsUpdateMatchModalOpen(false)}
                onSave={(id, data) => handleSaveMatchSchedule(id, data)}
                match={selectedMatchForEdit}
                venues={venues}
            />
        </Box>
    );
};
