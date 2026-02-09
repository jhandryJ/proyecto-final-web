import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    InputAdornment,
    CircularProgress,
    Alert,
    IconButton,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { Email, ArrowBack, Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import logo from '../../assets/logo.png';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setStatus(null);

        try {
            const response = await authService.forgotPassword(email);
            setStatus({ type: 'success', message: response.message });
            setActiveStep(1);
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Error al enviar el código. Intente más tarde.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
            return;
        }

        if (password.length < 8) {
            setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            await authService.resetPassword({ token: code, newPassword: password });
            setActiveStep(2);
            setStatus({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Código inválido o error al actualizar.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <form onSubmit={handleSendCode}>
                        <Stack spacing={3}>
                            <Typography variant="body2" color="text.secondary">
                                Ingresa tu correo institucional y te enviaremos un código de 6 dígitos.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Correo Institucional"
                                type="email"
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />
                            {status?.type === 'error' && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {status.message}
                                </Alert>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading}
                                sx={{ py: 1.5, borderRadius: 10, fontWeight: 'bold' }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Código'}
                            </Button>
                        </Stack>
                    </form>
                );
            case 1:
                return (
                    <form onSubmit={handleResetPassword}>
                        <Stack spacing={2.5}>
                            <Alert severity="success" sx={{ borderRadius: 2, mb: 1 }}>
                                Código enviado a tu correo.
                            </Alert>

                            <TextField
                                fullWidth
                                label="Código de 6 dígitos"
                                variant="outlined"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                disabled={isLoading}
                                required
                                placeholder="000000"
                                inputProps={{
                                    sx: { textAlign: 'center', letterSpacing: 8, fontSize: '1.2rem', fontWeight: 'bold' }
                                }}
                                sx={{ mb: 1 }}
                            />

                            <TextField
                                fullWidth
                                label="Nueva Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Confirmar Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            {status?.type === 'error' && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {status.message}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading || code.length < 6}
                                sx={{ py: 1.5, borderRadius: 10, fontWeight: 'bold' }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Restablecer Contraseña'}
                            </Button>

                            <Button
                                variant="text"
                                color="inherit"
                                size="small"
                                onClick={() => setActiveStep(0)}
                                sx={{ textTransform: 'none' }}
                            >
                                ¿No recibiste el código? Volver a intentar
                            </Button>
                        </Stack>
                    </form>
                );
            case 2:
                return (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                        <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            ¡Todo listo!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Tu contraseña ha sido actualizada. Redirigiendo al inicio de sesión...
                        </Typography>
                        <CircularProgress size={24} />
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', bgcolor: 'primary.main', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 450,
                    borderRadius: 4,
                    textAlign: 'center'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => activeStep === 1 ? setActiveStep(0) : navigate('/login')} size="small">
                        <ArrowBack />
                    </IconButton>
                    <Box component="img" src={logo} alt="UIDE Logo" sx={{ width: 100 }} />
                    <Box sx={{ width: 40 }} /> {/* Spacer */}
                </Box>

                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: 'secondary.main' }}>
                    Recuperar Cuenta
                </Typography>

                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    <Step><StepLabel>Email</StepLabel></Step>
                    <Step><StepLabel>Verificación</StepLabel></Step>
                    <Step><StepLabel>Listo</StepLabel></Step>
                </Stepper>

                {renderStep()}
            </Paper>
        </Box>
    );
};
