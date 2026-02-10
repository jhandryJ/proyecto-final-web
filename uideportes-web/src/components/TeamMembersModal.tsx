import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Divider,
    Box,
    Chip
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    School as SchoolIcon,
    Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

import type { Team } from '../types';

interface TeamMembersModalProps {
    open: boolean;
    onClose: () => void;
    team: Team | null;
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({ open, onClose, team }) => {
    const { user } = useAuth();

    if (!team) return null;

    const isCaptain = user?.id === team.capitanId;
    const isAdmin = user?.rol === 'ADMIN';
    const canSeeDetails = isCaptain || isAdmin;

    const miembros = team.miembros || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{
                bgcolor: '#001F52',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 2
            }}>
                <Avatar src={''} sx={{ bgcolor: '#EDB112', color: '#001F52', fontWeight: 'bold' }}>
                    {team.nombre.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        Miembros del Equipo
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {team.nombre} • {miembros.length} Integrantes
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <List sx={{ pt: 0 }}>
                    {miembros.map((miembro, index) => {
                        const { usuario } = miembro;
                        if (!usuario) return null;

                        const isUserCaptain = usuario.id === team.capitanId;

                        return (
                            <React.Fragment key={usuario.id}>
                                <ListItem alignItems="flex-start" sx={{
                                    py: 2,
                                    bgcolor: isUserCaptain ? 'rgba(237, 177, 18, 0.05)' : 'inherit'
                                }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: isUserCaptain ? '#EDB112' : '#f1f5f9',
                                            color: isUserCaptain ? '#001F52' : '#64748b'
                                        }}>
                                            {isUserCaptain ? <StarIcon /> : <PersonIcon />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {usuario.nombres} {usuario.apellidos}
                                                </Typography>
                                                {isUserCaptain && (
                                                    <Chip
                                                        label="Capitán"
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            bgcolor: '#EDB112',
                                                            color: '#001F52'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <SchoolIcon sx={{ fontSize: 16 }} />
                                                    {usuario.carrera
                                                        ? `${usuario.carrera.facultad?.nombre || ''} - ${usuario.carrera.nombre}`.replace(/^ - /, '')
                                                        : 'Estudiante UIDE'}
                                                </Typography>

                                                {canSeeDetails && (
                                                    <Box sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px dashed #e2e8f0' }}>
                                                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', mb: 0.5 }}>
                                                            <EmailIcon sx={{ fontSize: 14 }} /> {usuario.email}
                                                        </Typography>
                                                        {usuario.cedula && (
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                                                                <BadgeIcon sx={{ fontSize: 14 }} /> Cédula: {usuario.cedula}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < miembros.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>

                {miembros.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">No hay miembros registrados en este equipo.</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        bgcolor: '#001F52',
                        px: 4
                    }}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};
