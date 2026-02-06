import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Paper,
    Button,
    Stack,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    Shuffle as ShuffleIcon,
    Group as GroupIcon,
    EmojiEvents as TrophyIcon,
    SportsSoccer as SportsIcon
} from '@mui/icons-material';
import type { Tournament } from '../types';

interface TournamentDetailsModalProps {
    tournament: Tournament | null;
    onClose: () => void;
    onDrawMatchups: (tournamentId: string) => void;
}

export function TournamentDetailsModal({
    tournament,
    onClose,
    onDrawMatchups,
}: TournamentDetailsModalProps) {
    const [isDrawing, setIsDrawing] = useState(false);

    if (!tournament) return null;

    const handleDraw = async () => {
        setIsDrawing(true);
        // Simulate animation delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        onDrawMatchups(tournament.id);
        setIsDrawing(false);
    };

    const canDraw = tournament.status === 'pending' && tournament.teams.length >= 2;

    // Type helper for match rounds
    const getRoundName = (round: number) => {
        switch (round) {
            case 1: return 'Primera Ronda';
            case 2: return 'Octavos de Final';
            case 3: return 'Cuartos de Final';
            case 4: return 'Semifinal';
            case 5: return 'Final';
            default: return `Ronda ${round}`;
        }
    };

    return (
        <Dialog
            open={!!tournament}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {tournament.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsIcon fontSize="small" />
                        {tournament.sport}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
                    {/* Left Column - Teams/Groups */}
                    <Box sx={{ flex: { xs: '1 1 auto', lg: '0 0 40%' }, minWidth: 0 }}>
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                <GroupIcon color="primary" />
                                Equipos Participantes ({tournament.teams.length})
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                                {tournament.teams.map((team, index) => (
                                    <Chip
                                        key={index}
                                        label={team}
                                        variant="outlined"
                                        sx={{ justifyContent: 'flex-start', py: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </Paper>

                        {tournament.groups && tournament.groups.length > 0 && (
                            <Stack spacing={2} sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                    <TrophyIcon color="primary" />
                                    Fase de Grupos
                                </Typography>
                                {tournament.groups.map((group, index) => (
                                    <Paper key={index} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                            {group.name}
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {group.teams.map((team, tIdx) => (
                                                <Typography key={tIdx} variant="body2" sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                                                    {team}
                                                </Typography>
                                            ))}
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}

                        {canDraw && (
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleDraw}
                                disabled={isDrawing}
                                startIcon={isDrawing ? <CircularProgress size={20} color="inherit" /> : <ShuffleIcon />}
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    color: 'white'
                                }}
                            >
                                {isDrawing ? 'Sorteando...' : 'Realizar Sorteo'}
                            </Button>
                        )}
                    </Box>

                    {/* Right Column - Matchups/Brackets */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                <ShuffleIcon color="primary" />
                                Enfrentamientos
                            </Typography>

                            {tournament.matchups && tournament.matchups.length > 0 ? (
                                <Box>
                                    {(tournament.format === 'knockout' || tournament.format === 'single-elimination') ? (
                                        <Stack spacing={4}>
                                            {Array.from(new Set(tournament.matchups.map(m => m.round))).sort().map(round => (
                                                <Box key={round}>
                                                    <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', fontWeight: 700 }}>
                                                        {getRoundName(round)}
                                                    </Typography>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                                        {(tournament.matchups || [])
                                                            .filter(m => m.round === round)
                                                            .map((matchup, index) => (
                                                                <Paper
                                                                    key={index}
                                                                    elevation={1}
                                                                    sx={{
                                                                        p: 2,
                                                                        borderRadius: 2,
                                                                        borderLeft: '4px solid',
                                                                        borderColor: 'primary.main',
                                                                        transition: 'transform 0.2s',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-2px)',
                                                                            boxShadow: 3
                                                                        }
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="body1" fontWeight="500" noWrap title={matchup.team1}>{matchup.team1}</Typography>
                                                                            <Typography variant="body1" fontWeight="500" noWrap title={matchup.team2}>{matchup.team2}</Typography>
                                                                        </Box>
                                                                        <Typography variant="h6" sx={{ color: 'text.disabled', fontWeight: 900, px: 2 }}>VS</Typography>
                                                                    </Box>
                                                                </Paper>
                                                            ))}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                                            {tournament.matchups.map((matchup, index) => (
                                                <Paper key={index} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography fontWeight="500">{matchup.team1}</Typography>
                                                    <Chip label="VS" size="small" />
                                                    <Typography fontWeight="500">{matchup.team2}</Typography>
                                                </Paper>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 8,
                                    color: 'text.secondary',
                                    bgcolor: 'rgba(0,0,0,0.02)',
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider'
                                }}>
                                    <ShuffleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {tournament.status === 'pending' ? 'Sorteo Pendiente' : 'No hay enfrentamientos'}
                                    </Typography>
                                    {canDraw && (
                                        <Typography variant="body2">
                                            Haz clic en "Realizar Sorteo" para comenzar
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
