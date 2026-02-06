import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    Stack,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import { Google, Person, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import logo from '../../assets/logo.png';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authService.login(username, password);
            console.log('Login successful', data);

            // Redirección basada en rol
            if (data.user.rol === 'ADMIN') {
                navigate('/dashboard');
            } else {
                navigate('/user-dashboard'); // Redirigir a dashboard de usuario
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            {/* Left Side - Blue Background with Logo */}
            <Box
                sx={{
                    flex: 1,
                    bgcolor: 'primary.main',
                    display: { xs: 'none', md: 'flex' }, // Ocultar en móviles si se desea responsive
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        width: '150%',
                        height: '150%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%)',
                        top: '-25%',
                        left: '-25%',
                    }}
                />

                <Box
                    component="img"
                    src={logo}
                    alt="UIDE Deportes Logo"
                    sx={{
                        width: '80%',
                        maxWidth: 450,
                        height: 'auto',
                        zIndex: 2,
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                    }}
                />
            </Box>

            {/* Right Side - Login Form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    p: 4
                }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        p: 5,
                        width: '100%',
                        maxWidth: 450,
                        borderRadius: 3,
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                >
                    <Typography
                        variant="h5"
                        component="h1"
                        align="center"
                        sx={{
                            fontWeight: 'bold',
                            color: 'secondary.main',
                            mb: 5
                        }}
                    >
                        Bienvenidos a UIDEportes
                    </Typography>

                    <form onSubmit={handleLogin}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                placeholder="Usuario"
                                variant="outlined"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            <TextField
                                fullWidth
                                placeholder="Contraseña"
                                type="password"
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            {error && (
                                <Typography color="error" variant="body2" align="center">
                                    {error}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'warning.main',
                                        color: '#333',
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        px: 6,
                                        py: 1.5,
                                        borderRadius: 50,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            bgcolor: 'warning.dark',
                                            boxShadow: 'none'
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {
                                        loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Iniciar sesión'
                                        )
                                    }
                                </Button>
                            </Box>
                        </Stack>
                    </form>

                    <Box sx={{ mt: 4, mb: 4, display: 'flex', alignItems: 'center' }}>
                        <Divider sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ mx: 2, fontWeight: 'bold', color: '#555' }}>
                            o
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Google />}
                        sx={{
                            bgcolor: '#e0e0e0',
                            color: '#333',
                            textTransform: 'none',
                            borderRadius: 50,
                            py: 1.5,
                            fontWeight: 500,
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#d5d5d5',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        Google
                    </Button>

                    <Typography
                        variant="caption"
                        display="block"
                        align="right"
                        sx={{ mt: 3, color: '#666' }}
                    >
                        No tienes cuenta ?{' '}
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontStyle: 'italic'
                            }}
                            onClick={() => navigate('/register')}
                        >
                            Registrate Aquí
                        </Typography>
                    </Typography>
                </Paper>
            </Box>
        </Box >
    );
};
