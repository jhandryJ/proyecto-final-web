import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Typography,
    Stack
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { es } from 'date-fns/locale';

interface Cancha {
    id: number;
    nombre: string;
    ubicacion?: string;
}

interface UpdateMatchModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (matchId: number, data: { fechaHora?: Date, canchaId?: number }) => Promise<void>;
    match: any; // Using any for flexibility with Matchup type
    venues: Cancha[];
}

export const UpdateMatchModal: React.FC<UpdateMatchModalProps> = ({
    open,
    onClose,
    onSave,
    match,
    venues
}) => {
    const [date, setDate] = useState<Date | null>(null);
    const [canchaId, setCanchaId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && match) {
            setDate(match.fechaHora ? new Date(match.fechaHora) : null);
            setCanchaId(match.cancha?.id || match.canchaId || '');
        }
    }, [open, match]);

    const handleSave = async () => {
        if (!match) return;
        setLoading(true);
        try {
            await onSave(Number(match.id), {
                fechaHora: date || undefined,
                canchaId: canchaId ? Number(canchaId) : undefined
            });
            onClose();
        } catch (error) {
            console.error('Failed to update match', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Programar Partido</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            {match?.team1 || match?.equipoLocal?.nombre || 'Local'} vs {match?.team2 || match?.equipoVisitante?.nombre || 'Visitante'}
                        </Typography>

                        <DateTimePicker
                            label="Fecha y Hora"
                            value={date}
                            onChange={(newValue) => setDate(newValue)}
                            slotProps={{ textField: { fullWidth: true } }}
                        />

                        <TextField
                            select
                            label="Cancha"
                            value={canchaId}
                            onChange={(e) => setCanchaId(Number(e.target.value))}
                            fullWidth
                        >
                            <MenuItem value="">
                                <em>Sin asignar</em>
                            </MenuItem>
                            {venues.map((venue) => (
                                <MenuItem key={venue.id} value={venue.id}>
                                    {venue.nombre} {venue.ubicacion ? `(${venue.ubicacion})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={loading}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};
