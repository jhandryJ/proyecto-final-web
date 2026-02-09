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
    People as UsersIcon,
} from '@mui/icons-material';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const menuItems = [
    { id: 'users', label: 'Usuarios', icon: UsersIcon }, // Added 'Usuarios' item
    { id: 'tournaments', label: 'Torneos', icon: TrophyIcon },
    { id: 'teams', label: 'Equipos', icon: GroupIcon },
    { id: 'matches', label: 'Partidos', icon: CalendarIcon },
    { id: 'streaming', label: 'Streaming', icon: VideoIcon },
    { id: 'standings', label: 'Tabla de Posiciones', icon: BarChartIcon },
    { id: 'payments', label: 'Pagos', icon: CalendarIcon }, // Using CalendarIcon as placeholder or need to import Paid
];

import { useAuth } from '../context/AuthContext';

export function Sidebar({ open, onClose, activeTab, onTabChange }: SidebarProps) {
    const { isAdmin } = useAuth();

    const handleItemClick = (tabId: string) => {
        onTabChange(tabId);
        onClose();
    };

    const filteredMenuItems = menuItems.filter(item => {
        if (item.id === 'payments' && !isAdmin) return false;
        if (item.id === 'users' && !isAdmin) return false;
        return true;
    });

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                    background: 'linear-gradient(180deg, #001F52 0%, #003366 100%)',
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

            <List sx={{ px: 2, mt: 2 }}>
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => handleItemClick(item.id)}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    px: 2,
                                    mb: 0.5,
                                    backgroundColor: isActive ? 'rgba(237, 177, 18, 0.15)' : 'transparent',
                                    borderLeft: isActive ? '4px solid #EDB112' : '4px solid transparent',
                                    '&:hover': {
                                        backgroundColor: isActive ? 'rgba(237, 177, 18, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#EDB112' : 'rgba(255,255,255,0.7)' }}>
                                    <Icon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.95rem',
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? '#EDB112' : 'rgba(255,255,255,0.9)',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    © 2026 UIDE
                </Typography>
            </Box>
        </Drawer>
    );
}
