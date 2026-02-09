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
}

export function MatchesSection({ matchups, tournaments, onEditResult }: MatchesSectionProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'played'>('all');
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

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
        ? matchups.filter(m => m.torneoId === parseInt(selectedTournamentId))
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
                            value={selectedTournamentId}
                            label="Seleccionar Torneo"
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                        >
                            {tournaments.length === 0 && (
                                <MenuItem value="" disabled>No hay torneos</MenuItem>
                            )}
                            {tournaments.map((tournament) => (
                                <MenuItem key={tournament.id} value={tournament.id}>
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
                    {filteredMatches.map((matchup) => (
                        <Paper
                            key={matchup.id}
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
                                            Ronda {matchup.round}
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
                                                {matchup.team1}
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
                                                {matchup.team2}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Winner Text */}
                                    {matchup.result?.played && (
                                        <Typography variant="body2" color="success.main" align="center" sx={{ mt: 1, fontWeight: 'medium' }}>
                                            {matchup.result.team1Score > matchup.result.team2Score
                                                ? `Ganó ${matchup.team1}`
                                                : matchup.result.team2Score > matchup.result.team1Score
                                                    ? `Ganó ${matchup.team2}`
                                                    : 'Empate'}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Action Button */}
                                <Box sx={{
                                    textAlign: { xs: 'stretch', md: 'right' },
                                    mt: { xs: 2, md: 0 },
                                    minWidth: { md: 200 }
                                }}>
                                    <Button
                                        fullWidth={isMobile}
                                        variant="outlined"
                                        startIcon={matchup.result?.played ? <EditIcon /> : <AddIcon />}
                                        onClick={() => onEditResult(matchup)}
                                    >
                                        {matchup.result?.played ? 'Editar Resultado' : 'Registrar'}
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
