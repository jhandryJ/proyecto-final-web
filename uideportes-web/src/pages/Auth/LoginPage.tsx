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
    FormControlLabel,
    Checkbox,
    IconButton,
    Link
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor ingrese sus credenciales');
            return;
        }

        setIsLoading(true);
        try {
            const userData = await login(email, password, rememberMe);

            // Redirigir según rol usando los datos retornados
            if (userData.rol === 'ADMIN') {
                navigate('/dashboard');
            } else {
                navigate('/user-dashboard');
            }
        } catch (err: any) {
            console.error('Error de inicio de sesión:', err);
            setError(err.response?.data?.message || 'Credenciales inválidas. Por favor intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #004B9B 0%, #0066CC 50%, #0080FF 100%)', // Splash Screen Gradient
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated Background Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -100,
                    left: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(50px)',
                    zIndex: 0
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -50,
                    right: -50,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(237, 177, 18, 0.2)', // Touch of Gold
                    backdropFilter: 'blur(50px)',
                    zIndex: 0
                }}
            />

            <Paper
                elevation={24}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.9)', // Glass effect base
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    zIndex: 1,
                    animation: 'slideUp 0.6s ease-out'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <img
                        src={logo}
                        alt="UIDE Deportes"
                        style={{ height: 60, marginBottom: 16 }}
                    />
                    <Typography
                        variant="h5"
                        component="h1"
                        align="center"
                        sx={{
                            fontWeight: 900,
                            color: '#001F52',
                            letterSpacing: -0.5
                        }}
                    >
                        Bienvenidos a UIDEportes
                    </Typography>
                </Box>

                <form onSubmit={handleLogin}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#475569', mb: 0.5, display: 'block' }}>
                                CORREO ELECTRÓNICO
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="ejemplo@uide.edu.ec"
                                type="email"
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: '#64748b' }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#0066CC' }, // Lighter blue focus
                                        input: { color: '#0f172a', fontWeight: 500 }
                                    }
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#475569', mb: 0.5, display: 'block' }}>
                                CONTRASEÑA
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Ingresa tu contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#64748b' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                disabled={isLoading}
                                                sx={{ color: '#64748b' }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#0066CC' }, // Lighter blue focus
                                        input: { color: '#0f172a', fontWeight: 500 }
                                    }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        sx={{
                                            color: '#cbd5e1',
                                            '&.Mui-checked': { color: '#0066CC' }
                                        }}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>Recordar sesión</Typography>}
                            />
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() => navigate('/forgot-password')}
                                sx={{ textDecoration: 'none', fontWeight: 700, color: '#0066CC', '&:hover': { textDecoration: 'underline' } }}
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            fullWidth
                            sx={{
                                background: 'linear-gradient(45deg, #EDB112 30%, #FFC107 90%)', // Gold Gradient
                                color: '#001F52', // Dark blue text for contrast on gold
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                py: 1.5,
                                borderRadius: 2,
                                boxShadow: '0 4px 14px 0 rgba(237, 177, 18, 0.4)',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #D49D0E 30%, #FFB300 90%)',
                                    boxShadow: '0 6px 20px 0 rgba(237, 177, 18, 0.6)',
                                    transform: 'scale(1.02)'
                                },
                                '&:disabled': {
                                    background: '#e0e0e0',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} sx={{ color: '#001F52' }} />
                            ) : (
                                'Iniciar sesión'
                            )}
                        </Button>
                    </Stack>
                </form>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                        ¿No tienes una cuenta?{' '}
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{
                                color: '#0066CC',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => navigate('/register')}
                        >
                            Regístrate aquí
                        </Typography>
                    </Typography>
                </Box>
            </Paper>

            <style>
                {`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </Box>
    );
};
