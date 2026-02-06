import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    TextField,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    Event as CalendarIcon
} from '@mui/icons-material';
import type { Matchup, MatchResult } from '../types';

interface MatchResultModalProps {
    isOpen: boolean;
    matchup: Matchup | null;
    onClose: () => void;
    onSaveResult: (matchupId: string, result: MatchResult) => void;
}

export function MatchResultModal({ isOpen, matchup, onClose, onSaveResult }: MatchResultModalProps) {
    const [team1Score, setTeam1Score] = useState('');
    const [team2Score, setTeam2Score] = useState('');
    const [date, setDate] = useState('');

    // Sync state when modal opens or matchup changes
    useEffect(() => {
        if (isOpen && matchup) {
            setTeam1Score(matchup.result?.team1Score?.toString() || '0');
            setTeam2Score(matchup.result?.team2Score?.toString() || '0');
            setDate(matchup.result?.date
                ? new Date(matchup.result.date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            );
        }
    }, [isOpen, matchup]);

    if (!matchup) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveResult(matchup.id, {
            team1Score: parseInt(team1Score) || 0,
            team2Score: parseInt(team2Score) || 0,
            played: true,
            date: new Date(date),
        });
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                elevation: 2,
                sx: { borderRadius: 3 }
            }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        Registrar Resultado
                    </Typography>
                    <IconButton onClick={onClose} size="small" aria-label="cerrar">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ py: 4 }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        mb: 4,
                        bgcolor: 'background.default',
                        p: 3,
                        borderRadius: 2
                    }}>
                        {/* Team 1 */}
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                sx={{
                                    mb: 2,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1.2
                                }}
                            >
                                {matchup.team1}
                            </Typography>
                            <TextField
                                type="number"
                                value={team1Score}
                                onChange={(e) => setTeam1Score(e.target.value)}
                                inputProps={{
                                    min: 0,
                                    style: { textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }
                                }}
                                variant="outlined"
                                sx={{
                                    width: 100,
                                    bgcolor: 'background.paper',
                                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                }}
                            />
                        </Box>

                        {/* VS Divider */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" color="text.secondary" fontWeight="900" sx={{ opacity: 0.5 }}>
                                VS
                            </Typography>
                        </Box>

                        {/* Team 2 */}
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                sx={{
                                    mb: 2,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1.2
                                }}
                            >
                                {matchup.team2}
                            </Typography>
                            <TextField
                                type="number"
                                value={team2Score}
                                onChange={(e) => setTeam2Score(e.target.value)}
                                inputProps={{
                                    min: 0,
                                    style: { textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }
                                }}
                                variant="outlined"
                                sx={{
                                    width: 100,
                                    bgcolor: 'background.paper',
                                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Date Picker */}
                    <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                        <TextField
                            fullWidth
                            label="Fecha del Partido"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: <CalendarIcon color="action" sx={{ mr: 1.5 }} />
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2 }
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Button
                        onClick={onClose}
                        variant="text"
                        color="inherit"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ borderRadius: 2, px: 4 }}
                    >
                        Guardar Resultado
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
