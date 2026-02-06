import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Divider,
    Typography,
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    CalendarMonth as CalendarIcon,
    Videocam as VideoIcon,
    BarChart as BarChartIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { authService } from '../services/auth.service';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
    menuItems?: { id: string; label: string; icon: any }[];
}

const defaultMenuItems = [
    { id: 'tournaments', label: 'Torneos', icon: TrophyIcon },
    { id: 'teams', label: 'Equipos', icon: GroupIcon },
    { id: 'matches', label: 'Partidos', icon: CalendarIcon },
    { id: 'streaming', label: 'Streaming', icon: VideoIcon },
    { id: 'standings', label: 'Tabla de Posiciones', icon: BarChartIcon },
];

export function Sidebar({ open, onClose, activeTab, onTabChange, menuItems = defaultMenuItems }: SidebarProps) {
    const handleItemClick = (tabId: string) => {
        onTabChange(tabId);
        onClose();
    };

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                    background: 'linear-gradient(180deg, #004B9B 0%, #0066CC 100%)',
                    color: 'white',
                },
            }}
        >
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                    UIDEportes
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Sistema de Sorteos
                </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

            <List sx={{ px: 1, mt: 2 }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleItemClick(item.id)}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
                                    <Icon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.95rem',
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ p: 2 }}>
                <ListItemButton
                    onClick={() => authService.logout()}
                    sx={{
                        borderRadius: 2,
                        py: 1.5,
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                        },
                        transition: 'all 0.2s',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Cerrar Sesión"
                        primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: 500,
                        }}
                    />
                </ListItemButton>
            </Box>

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    © 2026 UIDE
                </Typography>
            </Box>
        </Drawer>
    );
}
