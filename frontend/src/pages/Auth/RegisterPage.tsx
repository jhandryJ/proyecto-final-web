import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    Stack,
    InputAdornment
} from '@mui/material';
import {
    Google,
    Email,
    Lock,
    ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import logo from '../../assets/logo.png';

export function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        cedula: '',
        facultad: '',
        carrera: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            await authService.register({
                nombres: formData.firstName,
                apellidos: formData.lastName,
                email: formData.email,
                password: formData.password,
                cedula: formData.cedula,
                facultad: formData.facultad,
                carrera: formData.carrera
            });
            // Registro exitoso
            navigate('/login');
            alert('Registro exitoso. Por favor inicie sesión.');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al registrarse. Intente nuevamente.');
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
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Effect */}
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

            {/* Right Side - Register Form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'white',
                    p: 4,
                    overflowY: 'auto'
                }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        p: 5,
                        width: '100%',
                        maxWidth: 500,
                        borderRadius: 3,
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                >
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/login')}
                        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
                    >
                        Volver al Login
                    </Button>

                    <Typography
                        variant="h5"
                        component="h1"
                        align="center"
                        sx={{
                            fontWeight: 'bold',
                            color: 'secondary.main',
                            mb: 4
                        }}
                    >
                        Crear Cuenta Nueva
                    </Typography>

                    <form onSubmit={handleRegister}>
                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    name="firstName"
                                    placeholder="Nombre"
                                    variant="outlined"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    fullWidth
                                    name="lastName"
                                    placeholder="Apellido"
                                    variant="outlined"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                            </Box>

                            <TextField
                                fullWidth
                                name="cedula"
                                placeholder="Cédula"
                                variant="outlined"
                                value={formData.cedula}
                                onChange={handleChange}
                                required
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />

                            <TextField
                                fullWidth
                                name="email"
                                placeholder="Correo Institucional"
                                type="email"
                                variant="outlined"
                                value={formData.email}
                                onChange={handleChange}
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

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    name="facultad"
                                    placeholder="Facultad"
                                    variant="outlined"
                                    value={formData.facultad}
                                    onChange={handleChange}
                                    required
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    fullWidth
                                    name="carrera"
                                    placeholder="Carrera"
                                    variant="outlined"
                                    value={formData.carrera}
                                    onChange={handleChange}
                                    required
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                            </Box>

                            <TextField
                                fullWidth
                                name="password"
                                placeholder="Contraseña"
                                type="password"
                                variant="outlined"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            <TextField
                                fullWidth
                                name="confirmPassword"
                                placeholder="Confirmar Contraseña"
                                type="password"
                                variant="outlined"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
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
                                    disabled={loading}
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
                                >
                                    {loading ? 'Registrando...' : 'Registrarse'}
                                </Button>
                            </Box>
                        </Stack>
                    </form>

                    <Box sx={{ mt: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Divider sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ mx: 2, fontWeight: 'bold', color: '#555' }}>
                            o regístrate con
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
                </Paper>
            </Box>
        </Box>
    );
}
