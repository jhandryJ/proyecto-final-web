import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    IconButton,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { feedbackService } from '../services/feedback.service';
import { TipoFeedback } from '../types';

interface FeedbackFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function FeedbackForm({ isOpen, onClose, onSuccess }: FeedbackFormProps) {
    const [tipo, setTipo] = useState<string>('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await feedbackService.create({
                tipo,
                mensaje,
            });

            setTipo('');
            setMensaje('');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error submitting feedback:', err);
            setError(err.response?.data?.message || 'Error al enviar el feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    Enviar Feedback
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                label="Tipo"
                            >
                                <MenuItem value={TipoFeedback.RECLAMO}>Reclamo</MenuItem>
                                <MenuItem value={TipoFeedback.SUGERENCIA}>Sugerencia</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Describe tu reclamo o sugerencia..."
                            required
                            fullWidth
                            multiline
                            rows={6}
                        />

                        <Alert severity="info">
                            <Typography variant="body2">
                                Tu feedback nos ayuda a mejorar. Sé específico y constructivo en tus comentarios.
                            </Typography>
                        </Alert>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} variant="outlined" size="large" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={<SendIcon />}
                    >
                        {loading ? 'Enviando...' : 'Enviar Feedback'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
