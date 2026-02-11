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
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    DateRange as DateIcon,
    Person as PersonIcon,
    Groups as GroupIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
    PendingActions as PendingIcon,
    MonetizationOn as PaidIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { EstadoPago, type ValidacionPago } from '../types';
import { API_CONFIG } from '../config/api';

interface PaymentValidationProps {
    onSuccess?: () => void;
}

export function PaymentValidation({ onSuccess }: PaymentValidationProps) {
    const [payments, setPayments] = useState<ValidacionPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<ValidacionPago | null>(null);
    const [tabValue, setTabValue] = useState(0);

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
            // Fetch ALL payments to calculate totals and show history
            const data = await paymentsService.getAll();
            setPayments(data);
            setError('');
        } catch (err) {
            console.error('Error al cargar pagos:', err);
            setError('Error al cargar los pagos. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
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
            const updatedPayment = await paymentsService.validate(selectedPayment.id, {
                estado: reviewEstado as typeof EstadoPago[keyof typeof EstadoPago],
                observacion: reviewObservacion || undefined,
            });

            // Update local state: replace the processed payment with the updated one
            setPayments(prev => prev.map(p => p.id === selectedPayment.id ? updatedPayment : p));

            handleCloseReview();
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error('Error al validar pago:', err);
            alert(err.response?.data?.message || 'Error al procesar la validación');
        } finally {
            setProcessingReview(false);
        }
    };

    // Derived State
    const pendingPayments = payments.filter(p => p.estado === EstadoPago.PENDIENTE);
    const historyPayments = payments.filter(p => p.estado !== EstadoPago.PENDIENTE);

    // Calculate Total Approved Amount
    const totalApproved = payments
        .filter(p => p.estado === EstadoPago.VALIDADO)
        .reduce((sum, p) => sum + Number(p.monto), 0);

    const getStatusChip = (estado: string) => {
        let color: "warning" | "success" | "error" | "default" = "default";

        switch (estado) {
            case EstadoPago.PENDIENTE: color = "warning"; break;
            case EstadoPago.VALIDADO: color = "success"; break;
            case EstadoPago.RECHAZADO: color = "error"; break;
        }

        return <Chip label={estado} size="small" color={color} sx={{ fontWeight: 700, borderRadius: 1.5 }} />;
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
        <Box sx={{ pb: 4 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1, mb: 1 }}>
                        Gestión de Pagos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Panel administrativo de pagos y validaciones.
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
                                <PendingIcon sx={{ color: '#EDB112' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.8 }}>PENDIENTES</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>{pendingPayments.length}</Typography>
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
                            <Box sx={{ p: 1, bgcolor: '#ECFDF5', borderRadius: 2 }}>
                                <PaidIcon sx={{ color: '#059669' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>TOTAL APROBADO</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#059669' }}>${totalApproved.toFixed(2)}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Ingresos validados</Typography>
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
                                <HistoryIcon sx={{ color: '#0284C7' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>HISTORIAL</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0F172A' }}>{historyPayments.length}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Pagos procesados</Typography>
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
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment tabs">
                        <Tab label={`Pendientes (${pendingPayments.length})`} sx={{ fontWeight: 600 }} />
                        <Tab label="Historial de Pagos" sx={{ fontWeight: 600 }} />
                    </Tabs>
                </Box>

                {loading ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <CircularProgress size={40} sx={{ color: '#001F52' }} />
                        <Typography sx={{ mt: 2, color: '#64748B' }}>Cargando datos...</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 4 }}>
                        <Alert severity="error">{error}</Alert>
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
                                {tabValue === 0 && pendingPayments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <CheckIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                                            <Typography color="text.secondary">No hay pagos pendientes.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {tabValue === 1 && historyPayments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Aún no hay historial de pagos.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {(tabValue === 0 ? pendingPayments : historyPayments).map((payment) => (
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
                                            {getStatusChip(payment.estado)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant={tabValue === 0 ? "contained" : "outlined"}
                                                size="small"
                                                startIcon={<ViewIcon />}
                                                onClick={() => handleOpenReview(payment)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {tabValue === 0 ? 'Revisar' : 'Ver Detalle'}
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
                                src={getImageUrl(selectedPayment.comprobanteUrl)}
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
                            {selectedPayment?.estado === EstadoPago.PENDIENTE ? 'Validar Pago' : 'Detalle del Pago'}
                            <IconButton onClick={handleCloseReview} size="small"><CloseIcon sx={{ color: '#94A3B8' }} /></IconButton>
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
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>ESTADO</Typography>

                                {selectedPayment?.estado === EstadoPago.PENDIENTE ? (
                                    <>
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
                                    </>
                                ) : (
                                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        {getStatusChip(selectedPayment?.estado || '')}
                                        {selectedPayment?.observacion && (
                                            <Typography variant="body2" sx={{ mt: 1, color: '#475569', fontStyle: 'italic' }}>
                                                "{selectedPayment.observacion}"
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, borderTop: '1px solid #eeeeee' }}>
                            <Button onClick={handleCloseReview} sx={{ color: '#64748B', fontWeight: 600 }}>
                                {selectedPayment?.estado === EstadoPago.PENDIENTE ? 'Cancelar' : 'Cerrar'}
                            </Button>

                            {selectedPayment?.estado === EstadoPago.PENDIENTE && (
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
                            )}
                        </DialogActions>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
