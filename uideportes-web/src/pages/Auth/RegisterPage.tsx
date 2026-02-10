import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    Stack,
    InputAdornment,
    CircularProgress,
    Alert,
    Autocomplete,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Google,
    Email,
    Lock,
    ArrowBack,
    Person,
    Badge
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        cedula: '',
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        confirmPassword: '',
        carrera: '',
        genero: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };



    const [careers, setCareers] = useState<any[]>([]);

    useEffect(() => {
        // Load all careers with faculty information
        import('../../services/faculties.service').then(mod => {
            mod.facultiesService.getAllCareers().then(setCareers).catch(console.error);
        });
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.cedula || !formData.nombres || !formData.apellidos || !formData.email || !formData.password || !formData.carrera) {
            setError('Por favor complete todos los campos requeridos');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            await register({
                cedula: formData.cedula,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                email: formData.email,
                password: formData.password,
                carreraId: Number(formData.carrera),
                genero: formData.genero,
                rol: 'ESTUDIANTE'
            });

            if (isAdmin) {
                navigate('/dashboard');
            } else {
                navigate('/user-dashboard');
            }
        } catch (err: any) {
            console.error('Error de registro:', err);
            setError(err.response?.data?.message || 'Error al registrar. Por favor intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            {/* Left Side ... */}
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
                        p: 3, // Reducido de 5
                        width: '100%',
                        maxWidth: 480, // Reducido de 500
                        borderRadius: 3,
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        maxHeight: '90vh', // Limitar altura para evitar scroll infinito visual
                        overflowY: 'auto'
                    }}
                >
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/login')}
                        sx={{ mb: 1, textTransform: 'none', color: 'text.secondary', py: 0 }} // Reducido mb:2 y py:0
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
                            mb: 2 // Reducido de 4
                        }}
                    >
                        Crear Cuenta Nueva
                    </Typography>

                    <form onSubmit={handleRegister}>
                        <Stack spacing={1.5}> {/* Reducido de 2.5 */}
                            {error && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                name="cedula"
                                placeholder="Cédula *"
                                variant="outlined"
                                value={formData.cedula}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Badge color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 1.5 }}> {/* Reducido gap:2 */}
                                <TextField
                                    fullWidth
                                    name="nombres"
                                    placeholder="Nombres *"
                                    variant="outlined"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
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
                                    name="apellidos"
                                    placeholder="Apellidos *"
                                    variant="outlined"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                    InputProps={{
                                        sx: { borderRadius: 2 }
                                    }}
                                />
                            </Box>

                            <TextField
                                fullWidth
                                name="email"
                                placeholder="Correo Institucional *"
                                type="email"
                                variant="outlined"
                                value={formData.email}
                                onChange={handleChange}
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

                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Género</InputLabel>
                                <Select
                                    value={formData.genero}
                                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                                    label="Género"
                                    disabled={isLoading}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="Masculino">Masculino</MenuItem>
                                    <MenuItem value="Femenino">Femenino</MenuItem>
                                    <MenuItem value="Otro">Otro</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                <Autocomplete
                                    options={[...careers].sort((a, b) => {
                                        const nameA = a.facultad?.nombre || '';
                                        const nameB = b.facultad?.nombre || '';
                                        return -nameB.localeCompare(nameA);
                                    })}
                                    groupBy={(option) => option.facultad?.nombre || 'Otras'}
                                    getOptionLabel={(option) => option.nombre}
                                    value={careers.find(c => c.id === Number(formData.carrera)) || null}
                                    onChange={(_, newValue) => {
                                        setFormData({
                                            ...formData,
                                            carrera: newValue ? String(newValue.id) : ''
                                        });
                                    }}
                                    disabled={isLoading}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Carrera"
                                            required
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                sx: { borderRadius: 2 }
                                            }}
                                        />
                                    )}
                                    noOptionsText="No se encontraron carreras"
                                />
                            </Box>

                            <TextField
                                fullWidth
                                name="password"
                                placeholder="Contraseña *"
                                type="password"
                                variant="outlined"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
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
                                placeholder="Confirmar Contraseña *"
                                type="password"
                                variant="outlined"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
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

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isLoading}
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
                                        },
                                        '&:disabled': {
                                            bgcolor: 'action.disabledBackground'
                                        }
                                    }}
                                >
                                    {isLoading ? (
                                        <CircularProgress size={24} sx={{ color: '#333' }} />
                                    ) : (
                                        'Registrarse'
                                    )}
                                </Button>
                            </Box>
                        </Stack>
                    </form>

                    <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}> {/* Reducido mt:3, mb:3 */}
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
