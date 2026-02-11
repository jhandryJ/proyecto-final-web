import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
    CalendarMonth as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ClockIcon,
    EmojiEvents as TrophyIcon,
    Edit as EditIcon,
    Add as AddIcon
} from '@mui/icons-material';
import type { Matchup, Tournament } from '../types';

interface MatchesSectionProps {
    matchups: Matchup[];
    tournaments: Tournament[];
    onEditResult: (matchup: Matchup) => void;
    onScheduleMatch: (matchup: Matchup) => void;
}

export function MatchesSection({ matchups, tournaments, onEditResult, onScheduleMatch }: MatchesSectionProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { isAdmin } = useAuth(); // Assuming useAuth is available or needed for permission check
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'played'>('all');
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

    // Auto-select first tournament if available
    useEffect(() => {
        if (tournaments.length > 0 && !selectedTournamentId) {
            setSelectedTournamentId(tournaments[0].id);
        }
    }, [tournaments, selectedTournamentId]);

    const handleFilterChange = (
        _event: React.MouseEvent<HTMLElement>,
        newFilter: 'all' | 'upcoming' | 'played',
    ) => {
        if (newFilter !== null) {
            setFilter(newFilter);
        }
    };

    // Filter by tournament first
    const tournamentMatches = selectedTournamentId
        ? matchups.filter(m => m.torneoId === selectedTournamentId)
        : [];

    const playedMatches = tournamentMatches.filter(m => m.result?.played);
    const upcomingMatches = tournamentMatches.filter(m => !m.result?.played);

    const filteredMatches =
        filter === 'all'
            ? tournamentMatches
            : filter === 'played'
                ? playedMatches
                : upcomingMatches;

    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
                mb: 3
            }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    Partidos
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>Seleccionar Torneo</InputLabel>
                        <Select
                            value={selectedTournamentId?.toString() || ''}
                            label="Seleccionar Torneo"
                            onChange={(e) => setSelectedTournamentId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                            {tournaments.length === 0 && (
                                <MenuItem value="" disabled>No hay torneos</MenuItem>
                            )}
                            {tournaments.map((tournament) => (
                                <MenuItem key={tournament.id} value={tournament.id.toString()}>
                                    {tournament.name || tournament.disciplina}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <ToggleButtonGroup
                        value={filter}
                        exclusive
                        onChange={handleFilterChange}
                        aria-label="filtro de partidos"
                        size="small"
                        fullWidth={isMobile}
                    >
                        <ToggleButton value="all">
                            Todos
                        </ToggleButton>
                        <ToggleButton value="upcoming">
                            Próximos
                        </ToggleButton>
                        <ToggleButton value="played">
                            Jugados
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {!selectedTournamentId ? (
                <Paper sx={{ textAlign: 'center', py: 12, bgcolor: 'transparent', boxShadow: 'none' }}>
                    <TrophyIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Selecciona un torneo para ver sus partidos
                    </Typography>
                </Paper>
            ) : filteredMatches.length === 0 ? (
                <Paper sx={{ textAlign: 'center', py: 12, bgcolor: 'transparent', boxShadow: 'none' }}>
                    <CalendarIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {filter === 'all'
                            ? 'No hay partidos programados para este torneo'
                            : filter === 'played'
                                ? 'No hay partidos jugados'
                                : 'No hay partidos próximos'}
                    </Typography>
                    {selectedTournament?.format === 'groups' && filter === 'all' && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Recuerda generar el sorteo del torneo para crear los partidos.
                        </Typography>
                    )}
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {selectedTournament?.format === 'groups' ? (
                        Object.entries(
                            filteredMatches.reduce((groups, match) => {
                                // Default to 'Sin Grupo' if no llave or weird format, but 'GA', 'GB' expected
                                const key = match.llave ? match.llave : 'Otros';
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(match);
                                return groups;
                            }, {} as Record<string, Matchup[]>)
                        ).sort((a, b) => a[0].localeCompare(b[0])).map(([groupKey, groupMatches]) => (
                            <Box key={groupKey} sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{
                                    mb: 2,
                                    mt: 1,
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    borderBottom: '2px solid',
                                    borderColor: 'primary.light',
                                    display: 'inline-block',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: 'primary.50'
                                }}>
                                    {groupKey.startsWith('G') ? `Grupo ${groupKey.substring(1)}` : (groupKey === 'Otros' ? 'Partidos' : groupKey)}
                                </Typography>
                                <Stack spacing={2}>
                                    {groupMatches.map((matchup) => (
                                        <MatchItem
                                            key={matchup.id}
                                            matchup={matchup}
                                            isAdmin={isAdmin}
                                            isMobile={isMobile}
                                            onScheduleMatch={onScheduleMatch}
                                            onEditResult={onEditResult}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        ))
                    ) : (
                        filteredMatches.map((matchup) => (
                            <MatchItem
                                key={matchup.id}
                                matchup={matchup}
                                isAdmin={isAdmin}
                                isMobile={isMobile}
                                onScheduleMatch={onScheduleMatch}
                                onEditResult={onEditResult}
                            />
                        ))
                    )}
                </Stack>
            )}
        </Box>
    );
}

interface MatchItemProps {
    matchup: Matchup;
    isAdmin: boolean;
    isMobile: boolean;
    onScheduleMatch: (matchup: Matchup) => void;
    onEditResult: (matchup: Matchup) => void;
}

function MatchItem({ matchup, isAdmin, isMobile, onScheduleMatch, onEditResult }: MatchItemProps) {
    return (
        <Paper
            elevation={1}
            sx={{
                p: 3,
                borderLeft: '4px solid',
                borderColor: matchup.result?.played ? 'success.main' : 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                }
            }}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2
            }}>
                {/* Main Content */}
                <Box sx={{ flex: 1 }}>
                    {/* Status & Date */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        {matchup.result?.played ? (
                            <Chip
                                icon={<CheckCircleIcon />}
                                label="Jugado"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        ) : (
                            <Chip
                                icon={<ClockIcon />}
                                label="Programado"
                                color="default"
                                size="small"
                                variant="outlined"
                            />
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 16 }} />
                            {matchup.scheduledDate
                                ? new Date(matchup.scheduledDate).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : 'Fecha por confirmar'}
                        </Typography>
                        <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                            Ronda {matchup.round || (matchup.fase === 'GRUPOS' ? '-' : matchup.fase)}
                        </Typography>
                    </Stack>

                    {/* Teams & Score */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight="bold">
                                {matchup.team1 || matchup.equipoLocal?.nombre}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                            {matchup.result?.played ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {matchup.result.team1Score}
                                    </Typography>
                                    <Typography variant="h5" color="text.secondary">-</Typography>
                                    <Typography variant="h4" fontWeight="bold">
                                        {matchup.result.team2Score}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography variant="h5" color="text.disabled" fontWeight="bold">
                                    VS
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" fontWeight="bold">
                                {matchup.team2 || matchup.equipoVisitante?.nombre}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Winner Text */}
                    {matchup.result?.played && (
                        <Typography variant="body2" color="success.main" align="center" sx={{ mt: 1, fontWeight: 'medium' }}>
                            {matchup.result.team1Score > matchup.result.team2Score
                                ? `Ganó ${matchup.team1 || matchup.equipoLocal?.nombre}`
                                : matchup.result.team2Score > matchup.result.team1Score
                                    ? `Ganó ${matchup.team2 || matchup.equipoVisitante?.nombre}`
                                    : 'Empate'}
                        </Typography>
                    )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    textAlign: { xs: 'stretch', md: 'right' },
                    mt: { xs: 2, md: 0 },
                    minWidth: { md: 200 }
                }}>
                    {isAdmin && (
                        <Button
                            fullWidth={isMobile}
                            variant="outlined"
                            color="info"
                            startIcon={<CalendarIcon />}
                            onClick={() => onScheduleMatch(matchup)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Programar
                        </Button>
                    )}
                    <Button
                        fullWidth={isMobile}
                        variant="contained"
                        color={matchup.result?.played ? "success" : "primary"}
                        startIcon={matchup.result?.played ? <EditIcon /> : <AddIcon />}
                        onClick={() => onEditResult(matchup)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                        }}
                    >
                        {matchup.result?.played ? 'Editar Resultado' : 'Registrar'}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}

