import { AppBar, Toolbar, Box, Typography, Container, IconButton, Button } from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #004B9B 0%, #0066CC 100%)' }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ py: 1 }}>
                    <IconButton
                        color="inherit"
                        onClick={onMenuClick}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                        <Box
                            component="img"
                            src={logo}
                            alt="Logo"
                            sx={{
                                height: 50,
                                width: 'auto',
                                display: 'block'
                            }}
                        />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                                UIDE Deportes
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Sistema de Sorteos
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                                Universidad Internacional del Ecuador
                            </Typography>
                            {user && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    {user.nombres} ({user.rol})
                                </Typography>
                            )}
                        </Box>
                        <Button
                            color="inherit"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            Cerrar Sesión
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
