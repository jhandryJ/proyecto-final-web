import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Alert,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon, CheckCircle as CheckIcon, ContentCopy } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { apiClient } from '../services/api';

interface PaymentUploadProps {
    isOpen: boolean;
    onClose: () => void;
    equipoId: number;
    torneoId: number;
    onSuccess: () => void;
}

export function PaymentUpload({ isOpen, onClose, equipoId, torneoId, onSuccess }: PaymentUploadProps) {
    const [monto, setMonto] = useState('');
    const [comprobanteUrl, setComprobanteUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [bankTab, setBankTab] = useState(0);
    const [viewImage, setViewImage] = useState<string | null>(null);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setBankTab(newValue);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError('');

        try {
            const response = await apiClient.post('/uploads', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            if (response.data && response.data.url) {
                setComprobanteUrl(response.data.url);
            }
        } catch (err: any) {
            console.error('Error uploading file:', err);
            if (err.response) {
                console.log('Upload Error Status:', err.response.status);
                console.log('Upload Error Data:', err.response.data);
            }
            setError(`Error al subir la imagen: ${err.response?.data?.message || err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await paymentsService.create({
                equipoId,
                torneoId,
                monto: parseFloat(monto),
                comprobanteUrl,
            });

            setMonto('');
            setComprobanteUrl('');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error uploading payment:', err);
            setError(err.response?.data?.message || 'Error al subir el comprobante de pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                        Subir Comprobante de Pago
                    </Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}
                    >
                        {error && <Alert severity="error">{error}</Alert>}

                        <Alert severity="info" icon={false} sx={{ bgcolor: 'rgba(2, 136, 209, 0.08)' }}>
                            <Typography variant="body2">
                                Por favor realiza la transferencia/depósito y sube la captura del comprobante.
                            </Typography>
                        </Alert>

                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={bankTab} onChange={handleTabChange} variant="fullWidth">
                                <Tab label="Banco de Loja" />
                                <Tab label="Banco Pichincha" />
                            </Tabs>
                        </Box>

                        {bankTab === 0 && (
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Banco de Loja</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                    <Typography variant="body2">Cuenta de Ahorros: 2903798847</Typography>
                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText('2903798847')}>
                                        <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2">Titular: JARAMILLO GUACHON, DANNY FRANCISCO</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                    <Typography variant="body2">Cédula: 1105615536</Typography>
                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText('1105615536')}>
                                        <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2">Email: dannyjaramillofran1@gmail.com</Typography>
                            </Box>
                        )}

                        {bankTab === 1 && (
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Banco Pichincha</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                    <Typography variant="body2">Cuenta de Ahorro transaccional: 2207401336</Typography>
                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText('2207401336')}>
                                        <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2">Titular: JARAMILLO GUACHON, DANNY FRANCISCO</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                    <Typography variant="body2">Cédula: 1105615536</Typography>
                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText('1105615536')}>
                                        <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2">Email: dannyjaramillofran1@gmail.com</Typography>
                            </Box>
                        )}

                        <TextField
                            label="Monto Pagado ($)"
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            required
                            fullWidth
                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Captura del Comprobante *
                            </Typography>

                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="raised-button-file">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={uploading ? <CircularProgress size={20} /> : (comprobanteUrl ? <CheckIcon color="success" /> : <UploadIcon />)}
                                    fullWidth
                                    sx={{
                                        py: 2,
                                        borderStyle: 'dashed',
                                        color: comprobanteUrl ? 'success.main' : 'primary.main',
                                        borderColor: comprobanteUrl ? 'success.main' : 'primary.main'
                                    }}
                                >
                                    {uploading ? 'Subiendo...' : (comprobanteUrl ? 'Imagen subida correctamente' : 'Seleccionar Imagen')}
                                </Button>
                            </label>
                            {comprobanteUrl && (
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary', wordBreak: 'break-all' }}>
                                    Archivo cargado: ...{comprobanteUrl.split('/').pop()}
                                </Typography>
                            )}
                        </Box>

                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || !monto || !comprobanteUrl || uploading}
                        sx={{ px: 4 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Comprobante'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Image Viewer Dialog */}
            <Dialog
                open={!!viewImage}
                onClose={() => setViewImage(null)}
                maxWidth="md"
            >
                <Box sx={{ position: 'relative', bgcolor: 'white', p: 1 }}>
                    <IconButton
                        onClick={() => setViewImage(null)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <img
                        src={viewImage || ''}
                        alt="QR Full Size"
                        style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }}
                    />
                </Box>
            </Dialog>
        </>
    );
}
