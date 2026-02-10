import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Avatar,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import type { Tournament } from '../types';
import { standingsService, type TournamentStandings } from '../services/standings.service';

interface StandingsTableProps {
    tournaments: Tournament[];
}

export function StandingsTable({ tournaments }: StandingsTableProps) {
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | string>('');
    const [standings, setStandings] = useState<TournamentStandings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-select first tournament
    useEffect(() => {
        if (tournaments.length > 0 && !selectedTournamentId) {
            setSelectedTournamentId(tournaments[0].id);
        }
    }, [tournaments, selectedTournamentId]);

    // Load standings when tournament changes
    useEffect(() => {
        if (selectedTournamentId) {
            loadStandings(Number(selectedTournamentId));
        }
    }, [selectedTournamentId]);

    const loadStandings = async (torneoId: number) => {
        setIsLoading(true);
        setError('');
        try {
            const data = await standingsService.getByTournament(torneoId);
            setStandings(data);
        } catch (err: any) {
            console.error('Error al cargar tabla de posiciones:', err);
            setError(err.response?.data?.message || 'Error al cargar tabla de posiciones');
            setStandings(null);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStandingsTable = (teams: TournamentStandings['equipos'], title?: string) => (
        <Box sx={{ mb: title ? 3 : 0 }}>
            {title && (
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    {title}
                </Typography>
            )}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="tabla de posiciones">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Pos</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Equipo</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>PJ</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>G</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>E</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>P</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>GF</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>GC</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>DIF</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>PTS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teams.map((team, index) => (
                            <TableRow
                                key={team.equipoId}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    bgcolor: index < 3 ? 'rgba(33, 150, 243, 0.04)' : 'inherit',
                                    transition: 'background-color 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <TableCell component="th" scope="row">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography fontWeight={index < 3 ? 'bold' : 'regular'} color={index < 3 ? 'primary' : 'text.primary'}>
                                            {index + 1}
                                        </Typography>
                                        {index === 0 && <TrophyIcon sx={{ fontSize: 16, color: '#FFD700' }} />}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar
                                            src={team.logoUrl}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'primary.main',
                                                fontSize: 14,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {team.equipoNombre.charAt(0)}
                                        </Avatar>
                                        <Typography fontWeight="medium">
                                            {team.equipoNombre}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center">{team.partidosJugados}</TableCell>
                                <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                    {team.ganados}
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'text.secondary' }}>
                                    {team.empatados}
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                                    {team.perdidos}
                                </TableCell>
                                <TableCell align="center">{team.golesFavor}</TableCell>
                                <TableCell align="center">{team.golesContra}</TableCell>
                                <TableCell align="center">
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: team.diferencia > 0 ? 'success.main' : team.diferencia < 0 ? 'error.main' : 'text.secondary'
                                        }}
                                    >
                                        {team.diferencia > 0 ? '+' : ''}{team.diferencia}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                        {team.puntos}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    if (tournaments.length === 0) {
        return (
            <Box sx={{
                textAlign: 'center',
                py: 8,
                bgcolor: 'background.paper',
                borderRadius: 2,
                color: 'text.secondary'
            }}>
                <TrophyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography>No hay torneos disponibles</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Tournament Selector */}
            <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
                <InputLabel>Seleccionar Torneo</InputLabel>
                <Select
                    value={selectedTournamentId}
                    label="Seleccionar Torneo"
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                >
                    {tournaments.map((tournament) => (
                        <MenuItem key={tournament.id} value={tournament.id}>
                            {tournament.name || `${tournament.disciplina} - ${tournament.categoria}`}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Loading State */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Standings Display */}
            {!isLoading && standings && (
                <Box>
                    {/* Tournament Info */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                        <Typography variant="h5" fontWeight="bold">
                            {standings.torneoNombre}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                            Formato: {standings.tipoSorteo === 'GRUPOS' ? 'Fase de Grupos' :
                                standings.tipoSorteo === 'BRACKET' ? 'Eliminatoria' : 'Todos contra Todos'}
                        </Typography>
                    </Paper>

                    {/* Display by Groups or Single Table */}
                    {standings.tipoSorteo === 'GRUPOS' && standings.grupos && Object.keys(standings.grupos).length > 0 ? (
                        <Box>
                            {Object.entries(standings.grupos).map(([grupoNombre, equipos]) => (
                                <Accordion key={grupoNombre} defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Grupo {grupoNombre}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {renderStandingsTable(equipos)}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    ) : standings.tipoSorteo === 'BRACKET' ? (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Los torneos de eliminatoria directa no tienen tabla de posiciones.
                            Consulta la sección de partidos para ver los resultados.
                        </Alert>
                    ) : (
                        <>
                            {standings.tipoSorteo === 'GRUPOS' && (!standings.grupos || Object.keys(standings.grupos).length === 0) && (
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    Los grupos aún no han sido asignados. Mostrando tabla general.
                                </Alert>
                            )}
                            {renderStandingsTable(standings.equipos)}
                        </>
                    )}

                    {/* No matches played yet */}
                    {standings.equipos.length > 0 && standings.equipos.every(e => e.partidosJugados === 0) && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            Aún no se han jugado partidos en este torneo.
                        </Alert>
                    )}
                </Box>
            )}
        </Box>
    );
}
