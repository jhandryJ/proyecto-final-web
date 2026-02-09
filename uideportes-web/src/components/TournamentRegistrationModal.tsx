import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { tournamentsService, type Torneo } from '../services/tournaments.service';
import { type Team } from '../services/teams.service';
import { PaymentUpload } from './PaymentUpload';

interface TournamentRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: Torneo | null;
    userTeams: Team[];
    onSuccess: () => void;
}

export function TournamentRegistrationModal({
    isOpen,
    onClose,
    tournament,
    userTeams,
    onSuccess
}: TournamentRegistrationModalProps) {
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPaymentUpload, setShowPaymentUpload] = useState(false);
    const [registeredTeamId, setRegisteredTeamId] = useState<number | null>(null);

    // Filter teams where user is captain
    // This logic assumes `userTeams` passed are already filtered or we trust calling context
    // Ideally we double check or the UI only shows this button for valid users
    const captainTeams = userTeams;

    const handleRegister = async () => {
        if (!selectedTeamId || !tournament) return;

        setLoading(true);
        setError('');

        try {
            const teamId = parseInt(selectedTeamId);
            const response = await tournamentsService.registerTeam(tournament.id, teamId);

            setRegisteredTeamId(teamId);

            // Check if payment is needed
            // If API returns PENDIENTE_PAGO, show payment modal
            if (response.estado === 'PENDIENTE_PAGO' || response.message?.includes('Pendiente de pago')) {
                setShowPaymentUpload(true);
            } else {
                alert('Inscripción exitosa');
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Error registering:', err);
            if (err.response) {
                console.log('Registration Error Info:', {
                    status: err.response.status,
                    data: err.response.data
                });
            }

            // Check if already registered but pending payment (Recovery Flow)
            if (err.response?.status === 409 && err.response.data?.status === 'PENDIENTE_PAGO') {
                console.log('Detected PENDIENTE_PAGO, showing payment upload');
                setRegisteredTeamId(parseInt(selectedTeamId));
                setShowPaymentUpload(true);
                return;
            }

            setError(err.response?.data?.message || 'Error al inscribirse');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        alert('Comprobante subido exitosamente. Tu inscripción está en revisión.');
        setShowPaymentUpload(false);
        onSuccess();
        onClose();
    };

    if (showPaymentUpload && registeredTeamId && tournament) {
        return (
            <PaymentUpload
                isOpen={true}
                onClose={() => {
                    setShowPaymentUpload(false);
                    onClose(); // Close parent too if they cancel payment? Or just back? Let's close all.
                }}
                equipoId={registeredTeamId}
                torneoId={tournament.id}
                onSuccess={handlePaymentSuccess}
            />
        );
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="span">Inscribirse en {tournament?.disciplina} - {tournament?.categoria}</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Costo de Inscripción:
                        <Typography component="span" fontWeight="bold" color="primary" sx={{ ml: 1 }}>
                            {tournament?.costoInscripcion && tournament.costoInscripcion > 0
                                ? `$${tournament.costoInscripcion}`
                                : 'GRATIS'}
                        </Typography>
                    </Typography>
                </Box>

                <FormControl fullWidth required>
                    <InputLabel>Selecciona tu Equipo</InputLabel>
                    <Select
                        value={selectedTeamId}
                        label="Selecciona tu Equipo"
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {captainTeams.map(team => (
                            <MenuItem key={team.id} value={team.id}>
                                {team.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {tournament?.costoInscripcion && tournament.costoInscripcion > 0 && selectedTeamId && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Este torneo tiene un costo. Deberás subir un comprobante de pago después de inscribirte.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleRegister}
                    disabled={!selectedTeamId || loading}
                >
                    {loading ? 'Procesando...' : 'Inscribirse'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
