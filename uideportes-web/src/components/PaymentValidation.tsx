import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    AttachMoney as MoneyIcon,
    DateRange as DateIcon,
    Person as PersonIcon,
    Groups as GroupIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { EstadoPago, type ValidacionPago } from '../types';

interface PaymentValidationProps {
    onSuccess?: () => void;
}

export function PaymentValidation({ onSuccess }: PaymentValidationProps) {
    const [payments, setPayments] = useState<ValidacionPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<ValidacionPago | null>(null);

    // Review State
    const [reviewEstado, setReviewEstado] = useState<string>('');
    const [reviewObservacion, setReviewObservacion] = useState('');
    const [processingReview, setProcessingReview] = useState(false);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await paymentsService.getPending();
            setPayments(data);
            setError('');
        } catch (err) {
            console.error('Error loading payments:', err);
            setError('Error al cargar los pagos pendientes. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReview = (payment: ValidacionPago) => {
        setSelectedPayment(payment);
        setReviewEstado('');
        setReviewObservacion('');
        setReviewModalOpen(true);
    };

    const handleCloseReview = () => {
        setReviewModalOpen(false);
        setSelectedPayment(null);
    };

    const handleSubmitReview = async () => {
        if (!selectedPayment || !reviewEstado) return;

        setProcessingReview(true);
        try {
            await paymentsService.validate(selectedPayment.id, {
                estado: reviewEstado as typeof EstadoPago[keyof typeof EstadoPago],
                observacion: reviewObservacion || undefined,
            });

            // Update local state
            setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));

            handleCloseReview();
            if (onSuccess) onSuccess();

            // Optional: Show success snackbar
        } catch (err: any) {
            console.error('Error validating payment:', err);
            alert(err.response?.data?.message || 'Error al procesar la validación');
        } finally {
            setProcessingReview(false);
        }
    };

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.monto), 0);

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1, mb: 1 }}>
                        Gestión de Pagos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Valida y gestiona los comprobantes de pago de los equipos.
                    </Typography>
                </Box>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={loadPayments}
                    variant="outlined"
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                    Actualizar
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
                        color: 'white',
                        boxShadow: '0 4px 20px rgba(0, 31, 82, 0.2)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                <VisibilityIcon sx={{ color: '#EDB112' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.8 }}>PENDIENTES</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>{payments.length}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Solicitudes por revisar</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: 'white',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: '#F0F9FF', borderRadius: 2 }}>
                                <MoneyIcon sx={{ color: '#0284C7' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>MONTO TOTAL</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0F172A' }}>${totalAmount.toFixed(2)}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>En espera de aprobación</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Content */}
            <Paper sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}>
                {loading ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <CircularProgress size={40} sx={{ color: '#001F52' }} />
                        <Typography sx={{ mt: 2, color: '#64748B' }}>Cargando pagos...</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 4 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                ) : payments.length === 0 ? (
                    <Box sx={{ p: 8, textAlign: 'center' }}>
                        <CheckIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" fontWeight="bold">¡Todo al día!</Typography>
                        <Typography color="text.secondary">No hay pagos pendientes de revisión en este momento.</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Equipo</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Solicitante</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Fecha</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Monto</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <GroupIcon sx={{ color: '#94A3B8' }} />
                                                <Typography fontWeight="600" color="#0F172A">
                                                    {payment.equipo?.nombre || `Equipo #${payment.equipoId}`}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <PersonIcon sx={{ color: '#94A3B8' }} />
                                                <Typography variant="body2">
                                                    {payment.usuarioPago?.nombres} {payment.usuarioPago?.apellidos}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <DateIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                                <Typography variant="body2">
                                                    {new Date(payment.fechaSubida).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight="700" color="primary.main">
                                                ${payment.monto}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={payment.estado}
                                                size="small"
                                                color="warning"
                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<ViewIcon />}
                                                onClick={() => handleOpenReview(payment)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: 'none',
                                                    bgcolor: '#EFF6FF',
                                                    color: '#1D4ED8',
                                                    '&:hover': { bgcolor: '#DBEAFE', boxShadow: 'none' }
                                                }}
                                            >
                                                Revisar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Review Modal */}
            <Dialog
                open={reviewModalOpen}
                onClose={handleCloseReview}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, overflow: 'hidden' }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, maxHeight: '90vh' }}>
                    {/* Left: Image Viewer */}
                    <Box sx={{
                        flex: 2,
                        bgcolor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        minHeight: 400
                    }}>
                        {selectedPayment?.comprobanteUrl ? (
                            <img
                                src={selectedPayment.comprobanteUrl}
                                alt="Comprobante"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <Typography color="white">No hay imagen disponible</Typography>
                        )}
                    </Box>

                    {/* Right: Action Panel */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0' }}>
                        <DialogTitle sx={{ borderBottom: '1px solid #eeeeee', fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Validar Pago
                            <IconButton onClick={handleCloseReview} size="small"><Box component={CheckIcon} sx={{ transform: 'rotate(45deg)', color: '#94A3B8' }} /></IconButton> {/* Using CheckIcon as close button placeholder or import CloseIcon properly if preferred, keeping simple */}
                        </DialogTitle>

                        <DialogContent sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>DETALLES DEL PAGO</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Equipo</Typography>
                                        <Typography variant="body2" fontWeight="600">{selectedPayment?.equipo?.nombre}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            {selectedPayment && new Date(selectedPayment.fechaSubida).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" color="text.secondary">Monto Declarado</Typography>
                                        <Typography variant="h5" fontWeight="800" color="primary.main">
                                            ${selectedPayment?.monto}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>DECISIÓN</Typography>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Estado de la Validación</InputLabel>
                                    <Select
                                        value={reviewEstado}
                                        label="Estado de la Validación"
                                        onChange={(e) => setReviewEstado(e.target.value)}
                                    >
                                        <MenuItem value={EstadoPago.VALIDADO}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#16A34A' }}>
                                                <CheckIcon fontSize="small" /> APROBAR PAGO
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value={EstadoPago.RECHAZADO}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#DC2626' }}>
                                                <RejectIcon fontSize="small" /> RECHAZAR PAGO
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Observaciones (Opcional)"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={reviewObservacion}
                                    onChange={(e) => setReviewObservacion(e.target.value)}
                                    placeholder="Ingrese razón del rechazo o nota de aprobación..."
                                />
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, borderTop: '1px solid #eeeeee' }}>
                            <Button onClick={handleCloseReview} sx={{ color: '#64748B', fontWeight: 600 }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color={reviewEstado === EstadoPago.RECHAZADO ? 'error' : 'primary'}
                                onClick={handleSubmitReview}
                                disabled={!reviewEstado || processingReview}
                                sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1,
                                    boxShadow: 'none'
                                }}
                            >
                                {processingReview ? 'Procesando...' : 'Confirmar Decisión'}
                            </Button>
                        </DialogActions>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}

// Helper icon component if ViewIcon was not imported correctly locally, but assumed from existing imports
function VisibilityIcon(props: any) {
    return <ViewIcon {...props} />;
}

