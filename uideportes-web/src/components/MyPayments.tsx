import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem,
    CircularProgress,
    IconButton,
    Alert
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Close as CloseIcon } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { teamsService, type Team } from '../services/teams.service';
import { tournamentsService, type Campeonato } from '../services/tournaments.service';
import type { ValidacionPago } from '../types';
import { PaymentUpload } from './PaymentUpload';
import { API_CONFIG } from '../config/api';

interface MyPaymentsProps {
    userId: number;
}

export const MyPayments: React.FC<MyPaymentsProps> = () => {
    const [payments, setPayments] = useState<ValidacionPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openUploadModal, setOpenUploadModal] = useState(false);

    // Upload Form State
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [tournaments, setTournaments] = useState<Campeonato[]>([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

    useEffect(() => {
        loadPayments();
        loadFormOptions();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await paymentsService.getAll();
            setPayments(data);
        } catch (err) {
            console.error('Error al cargar pagos:', err);
            setError('Error al cargar historial de pagos.');
        } finally {
            setLoading(false);
        }
    };

    const loadFormOptions = async () => {
        try {
            const myTeams = await teamsService.getUserTeams();
            setTeams(myTeams);
            const tourneys = await tournamentsService.getCampeonatos();
            setTournaments(tourneys);
        } catch (err) {
            console.error('Error al cargar opciones:', err);
        }
    };

    const handleOpenUpload = () => {
        setOpenUploadModal(true);
    };

    const handleContinueToPayment = () => {
        if (selectedTeam && selectedTournament) {
            setShowPaymentModal(true);
            setOpenUploadModal(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VALIDADO': return 'success';
            case 'RECHAZADO': return 'error';
            default: return 'warning';
        }
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;

        // Remove /api from end of BASE_URL to get the root URL where static files are served
        const baseUrl = API_CONFIG.BASE_URL.endsWith('/api')
            ? API_CONFIG.BASE_URL.slice(0, -4)
            : API_CONFIG.BASE_URL;

        return `${baseUrl}${url}`;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 900, color: '#001F52' }}>
                    Mis Pagos y Comprobantes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenUpload}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        px: 3,
                        background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
                        fontWeight: 800
                    }}
                >
                    Subir Nuevo Pago
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,31,82,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Equipo</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Monto</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Observación</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#001F52' }}>Comprobante</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{new Date(payment.fechaSubida).toLocaleDateString()}</TableCell>
                                    <TableCell>{payment.equipo?.nombre || 'N/A'}</TableCell>
                                    <TableCell>${payment.monto}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={payment.estado}
                                            color={getStatusColor(payment.estado) as any}
                                            size="small"
                                            sx={{ fontWeight: 800, borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell>{payment.observacion || '-'}</TableCell>
                                    <TableCell>
                                        {payment.comprobanteUrl && (
                                            <IconButton
                                                size="small"
                                                onClick={() => setViewProofUrl(getImageUrl(payment.comprobanteUrl))}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No hay pagos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Proof Viewer Dialog */}
            <Dialog
                open={!!viewProofUrl}
                onClose={() => setViewProofUrl(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, overflow: 'hidden' }
                }}
            >
                <Box sx={{ position: 'relative', bgcolor: '#000', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                        onClick={() => setViewProofUrl(null)}
                        sx={{
                            position: 'absolute',
                            right: 12,
                            top: 12,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            zIndex: 1,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <img
                        src={viewProofUrl || ''}
                        alt="Comprobante"
                        style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block', objectFit: 'contain' }}
                    />
                </Box>
            </Dialog>

            {/* Selection Modal */}
            <Dialog open={openUploadModal} onClose={() => setOpenUploadModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Seleccionar Equipo y Torneo</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            select
                            label="Equipo"
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            fullWidth
                        >
                            {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id}>{team.nombre}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Torneo/Campeonato"
                            value={selectedTournament}
                            onChange={(e) => setSelectedTournament(e.target.value)}
                            fullWidth
                        >
                            {tournaments.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                            <Button onClick={() => setOpenUploadModal(false)}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={handleContinueToPayment}
                                disabled={!selectedTeam || !selectedTournament}
                            >
                                Continuar al Pago
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Payment Upload Component */}
            {showPaymentModal && (
                <PaymentUpload
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    equipoId={Number(selectedTeam)}
                    torneoId={Number(selectedTournament)}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        loadPayments();
                        alert('Comprobante subido exitosamente.');
                    }}
                />
            )}
        </Box >
    );
};
