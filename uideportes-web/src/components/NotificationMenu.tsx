import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    Typography,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    DoneAll as DoneAllIcon,
    NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface Notification {
    id: number;
    mensaje: string;
    leida: boolean;
    fecha: string;
    tipo: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
}

export function NotificationMenu() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await apiClient.get('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter((n: Notification) => !n.leida).length);
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await apiClient.put(`/notifications/${id}/leida`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error al marcar como leído:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.put('/notifications/leida-todas');
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    const handleDelete = async (id: number, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await apiClient.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id && !n.leida)) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        handleClose();
        if (!notification.leida) {
            await handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'SUCCESS': return <CheckCircleIcon fontSize="small" color="success" />;
            case 'ERROR': return <ErrorIcon fontSize="small" color="error" />;
            case 'WARNING': return <InfoIcon fontSize="small" color="warning" />;
            default: return <InfoIcon fontSize="small" color="info" />;
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick} size="large">
                <Badge
                    badgeContent={unreadCount}
                    sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: '#FFD700', // Gold UIDE
                            color: '#003366',
                            fontWeight: 'bold'
                        }
                    }}
                >
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        width: 380,
                        maxHeight: 500,
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#003366' }}>
                        Notificaciones
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllAsRead}
                            startIcon={<DoneAllIcon />}
                            sx={{ color: '#003366', textTransform: 'none' }}
                        >
                            Marcar todo como leído
                        </Button>
                    )}
                </Box>

                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                        <NotificationsOffIcon sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                        <Typography color="text.secondary">No tienes notificaciones</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <React.Fragment key={notification.id}>
                                <ListItem disablePadding secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        size="small"
                                        sx={{
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            '&:hover': { color: 'error.main' }
                                        }}
                                        className="delete-btn"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                                    sx={{
                                        '&:hover .delete-btn': { opacity: 1 }
                                    }}
                                >
                                    <ListItemButton
                                        alignItems="flex-start"
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{
                                            bgcolor: notification.leida ? 'transparent' : 'rgba(0, 51, 102, 0.04)',
                                            borderLeft: notification.leida ? '4px solid transparent' : '4px solid #FFD700',
                                            '&:hover': { bgcolor: 'rgba(0, 51, 102, 0.08)' },
                                            pr: 6,
                                            py: 2
                                        }}
                                    >
                                        <Box sx={{ mt: 0.5, mr: 2 }}>
                                            {getIcon(notification.tipo)}
                                        </Box>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" sx={{ fontWeight: notification.leida ? 500 : 700, color: '#333' }}>
                                                    {notification.tipo === 'SUCCESS' ? '¡Éxito!' :
                                                        notification.tipo === 'ERROR' ? 'Error' :
                                                            notification.tipo === 'WARNING' ? 'Aviso' : 'Información'}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="text.primary" sx={{ display: 'block', my: 0.5, lineHeight: 1.4 }}>
                                                        {notification.mensaje}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {new Date(notification.fecha).toLocaleString()}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Menu>
        </>
    );
}
