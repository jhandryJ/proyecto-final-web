import { AppBar, Toolbar, Box, Typography, Container, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import logo from '../assets/logo.png';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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

                    <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                            Universidad Internacional del Ecuador
                        </Typography>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
