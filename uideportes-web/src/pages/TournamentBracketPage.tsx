import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, CircularProgress, Paper, IconButton, Tabs, Tab } from '@mui/material';
import { ArrowBack as ArrowBackIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { BracketView } from '../components/BracketView';
import { GroupsView } from '../components/GroupsView';
import { tournamentsService } from '../services/tournaments.service';
import { matchesService } from '../services/matches.service';
import { resourcesService } from '../services/resources.service';
import { UpdateMatchModal } from '../components/UpdateMatchModal';
import type { Tournament, Matchup, Cancha } from '../types';
import { useAuth } from '../context/AuthContext';

export const TournamentBracketPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [venues, setVenues] = useState<Cancha[]>([]);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Matchup | null>(null);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleBack = () => {
        if (isAdmin) {
            navigate('/dashboard');
        } else {
            navigate('/user-dashboard');
        }
    };

    useEffect(() => {
        const fetchTournament = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const campeonatos = await tournamentsService.getCampeonatos();
                let foundTournament: any = null;
                let championshipName = '';

                for (const c of campeonatos) {
                    if (c.torneos) {
                        const t = c.torneos.find(t => t.id.toString() === id);
                        if (t) {
                            foundTournament = t;
                            championshipName = c.nombre;
                            break;
                        }
                    }
                }

                if (!foundTournament) {
                    setError('Torneo no encontrado');
                    setLoading(false);
                    return;
                }

                // Fetch matches
                let matchups: Matchup[] = [];
                try {
                    const partidos = await matchesService.getByTournament(foundTournament.id);
                    matchups = partidos.map(p => ({
                        id: p.id,
                        team1: p.equipoLocal?.nombre || 'Por definir',
                        team2: p.equipoVisitante?.nombre || 'Por definir',
                        equipoLocal: p.equipoLocal as any,
                        equipoVisitante: p.equipoVisitante as any,
                        fase: p.fase,
                        result: {
                            team1Score: p.marcadorLocal || 0,
                            team2Score: p.marcadorVisitante || 0,
                            played: p.estado === 'FINALIZADO',
                            date: new Date(p.fechaHora)
                        },
                        fechaHora: new Date(p.fechaHora),
                        estado: p.estado,
                        scheduledDate: new Date(p.fechaHora),
                        torneoId: foundTournament.id
                    }));
                } catch (e) {
                    console.warn('Error fetching matches', e);
                }

                // Parse groups logic
                let groups: any[] = [];
                // Check if we can extract groups from inscripciones (preferred) or config
                if (foundTournament.inscripciones) {
                    const groupsMap = new Map<string, string[]>();

                    foundTournament.inscripciones.forEach((insc: any) => {
                        if (insc.grupos && insc.grupos.length > 0) {
                            const groupName = insc.grupos[0].nombre;
                            if (!groupsMap.has(groupName)) {
                                groupsMap.set(groupName, []);
                            }
                            groupsMap.get(groupName)?.push(insc.equipo.nombre);
                        }
                    });

                    if (groupsMap.size > 0) {
                        groups = Array.from(groupsMap.entries()).map(([name, teams]) => ({
                            id: name,
                            name: `Grupo ${name}`,
                            teams
                        })).sort((a, b) => a.name.localeCompare(b.name));
                    }
                }

                // Fallback to manual assignments if no groups found in inscripciones AND we strictly expect groups logic
                if (groups.length === 0 && foundTournament.configuracion?.manualAssignments && (foundTournament.tipoSorteo === 'GRUPOS' || foundTournament.categoria === 'FASE_GRUPOS')) {
                    groups = Object.entries(foundTournament.configuracion.manualAssignments).map(([name, teamIds]) => ({
                        id: name,
                        name: `Grupo ${name}`,
                        teams: (teamIds as any[]).map(tid => `Equipo ${tid}`)
                    }));
                }

                const mappedTournament: Tournament = {
                    id: foundTournament.id.toString(),
                    campeonatoId: foundTournament.campeonatoId,
                    disciplina: foundTournament.disciplina,
                    categoria: foundTournament.categoria,
                    genero: foundTournament.genero || 'MIXTO',
                    name: `${championshipName} - ${foundTournament.categoria}`,
                    sport: foundTournament.disciplina,
                    format: (foundTournament.tipoSorteo === 'GRUPOS' && matchups.length === 0) ? 'groups' : 'knockout', // Hybrid handling below
                    status: matchups.length > 0 ? 'drawn' : 'pending',
                    matchups: matchups,
                    groups: groups
                };

                // Determine default tab: if we have knockout matches, show them first (tab 1), else groups (tab 0)
                const hasGroups = groups.length > 0;
                const hasBracket = matchups.some(m => m.fase !== 'GRUPOS');

                if (hasBracket && hasGroups) {
                    setTabValue(1); // Default to Bracket if both exist
                } else {
                    setTabValue(0);
                }

                setTournament(mappedTournament);
            } catch (err) {
                console.error(err);
                setError('Error al cargar el torneo');
            } finally {
                setLoading(false);
            }
        };

        const fetchVenues = async () => {
            try {
                const data = await resourcesService.getAllCanchas();
                setVenues(data);
            } catch (e) {
                console.error('Error fetching venues', e);
            }
        };

        fetchTournament();
        if (isAdmin) fetchVenues();
    }, [id, isAdmin]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !tournament) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error" variant="h5">{error || 'Torneo no encontrado'}</Typography>
                <Button onClick={handleBack} sx={{ mt: 2 }}>Volver</Button>
            </Box>
        );
    }

    const hasGroups = tournament.groups && tournament.groups.length > 0;
    // Filter out group stage matches from bracket view if necessary, or check if we have non-group matches
    const bracketMatches = tournament.matchups?.filter(m => m.fase !== 'GRUPOS') || [];
    const hasBracket = bracketMatches.length > 0;
    const showTabs = hasGroups && hasBracket;

    const handleGenerateKnockout = async () => {
        if (!tournament || !hasGroups) return;
        if (!window.confirm('¿Estás seguro de generar la fase eliminatoria? Esto se basará en las clasificaciones actuales de los grupos.')) return;

        try {
            setLoading(true);
            await tournamentsService.promoteToKnockout(Number(tournament.id));
            // Reload page or re-fetch
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al generar eliminatorias');
            setLoading(false);
        }
    };

    const handleEditMatch = (match: Matchup) => {
        setSelectedMatch(match);
        setIsUpdateModalOpen(true);
    };

    const handleSaveMatch = async (matchId: number, data: { fechaHora?: Date, canchaId?: number }) => {
        try {
            await matchesService.updateResult(matchId, {
                fechaHora: data.fechaHora,
                canchaId: data.canchaId
            });
            // Refresh data
            window.location.reload();
        } catch (err: any) {
            console.error('Error updating match', err);
            alert('Error al actualizar el partido');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                py: 3,
                px: 4,
                mb: 4,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrophyIcon color="primary" fontSize="large" />
                                {tournament.name}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                {tournament.sport} {tournament.genero}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Promote Button - ONLY FOR ADMINS */}
                    {isAdmin && hasGroups && !hasBracket && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleGenerateKnockout}
                            disabled={loading}
                            sx={{ fontWeight: 'bold' }}
                        >
                            Generar Eliminatorias
                        </Button>
                    )}
                </Box>

                {showTabs && (
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="tournament tabs" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label="Fase de Grupos" />
                        <Tab label="Fase Final" />
                    </Tabs>
                )}
            </Paper>

            <Container maxWidth="xl">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        minHeight: '600px',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        overflowX: 'auto'
                    }}
                >
                    {/* Logic for content based on tabs and available data */}
                    {showTabs ? (
                        tabValue === 0 ? (
                            <GroupsView
                                groups={tournament.groups || []}
                                matchups={tournament.matchups}
                                isAdmin={isAdmin}
                                onEditMatch={handleEditMatch}
                            />
                        ) : (
                            <BracketView
                                matchups={bracketMatches}
                                isAdmin={isAdmin}
                                onEditMatch={handleEditMatch}
                            />
                        )
                    ) : (
                        // No tabs, just show what we have
                        hasGroups ? (
                            <GroupsView
                                groups={tournament.groups || []}
                                matchups={tournament.matchups}
                                isAdmin={isAdmin}
                                onEditMatch={handleEditMatch}
                            />
                        ) : hasBracket ? (
                            <BracketView
                                matchups={bracketMatches}
                                isAdmin={isAdmin}
                                onEditMatch={handleEditMatch}
                            />
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 10 }}>
                                <Typography variant="h6" color="text.secondary">
                                    No hay información disponible para mostrar.
                                </Typography>
                            </Box>
                        )
                    )}
                </Paper>
            </Container>
            <UpdateMatchModal
                open={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onSave={handleSaveMatch}
                match={selectedMatch}
                venues={venues}
            />
        </Box>
    );
};
