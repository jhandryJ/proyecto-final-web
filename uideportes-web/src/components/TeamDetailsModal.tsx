import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Box,
    Avatar,
    Divider,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Group as GroupIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import type { Team } from '../types';

interface TeamDetailsModalProps {
    team: Team | null;
    onClose: () => void;
}

export function TeamDetailsModal({ team, onClose }: TeamDetailsModalProps) {
    if (!team) return null;

    return (
        <Dialog
            open={!!team}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={team.logoUrl}
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: team.color || team.logoUrl ? 'transparent' : 'primary.main',
                            fontWeight: 'bold',
                            fontSize: 24
                        }}
                    >
                        {!team.logoUrl && (team.nombre || team.name || '').charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                            {team.nombre || team.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {team.facultad || team.sport}
                        </Typography>
                        {team.capitan && (
                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Capitán: {team.capitan.nombres} {team.capitan.apellidos}
                                </Typography>
                                {team.capitan.carrera && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {team.capitan.carrera.facultad?.nombre} - {team.capitan.carrera.nombre}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {/* Stats Summary */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="primary" /> Estadísticas Generales
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{team.wins || 0}</Typography>
                            <Typography variant="caption">Victorias</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.300', borderRadius: 2 }}>
                            <Typography variant="h4" fontWeight="bold">{team.draws || 0}</Typography>
                            <Typography variant="caption">Empates</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'error.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{team.losses || 0}</Typography>
                            <Typography variant="caption">Derrotas</Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Goals Details */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        {team.sport === 'Fútbol' ? 'Rendimiento de Goles' : 'Rendimiento de Puntos'}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon color="success" />
                                <Typography>{team.sport === 'Fútbol' ? 'Goles a Favor' : 'Puntos a Favor'}</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">{team.goalsFor || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingDownIcon color="error" />
                                <Typography>{team.sport === 'Fútbol' ? 'Goles en Contra' : 'Puntos en Contra'}</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">{team.goalsAgainst || 0}</Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Players/Members List */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon color="primary" /> {team.miembros ? 'Miembros del Equipo' : 'Plantilla de Jugadores'}
                    </Typography>

                    {team.miembros && team.miembros.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {team.miembros.map((miembro) => (
                                <ListItem key={miembro.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
                                            {miembro.usuario?.nombres?.charAt(0) || 'M'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={miembro.usuario ? `${miembro.usuario.nombres} ${miembro.usuario.apellidos}` : 'Miembro'}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                                                {miembro.usuario?.email && (
                                                    <Typography variant="body2" component="span" color="text.secondary">
                                                        {miembro.usuario.email}
                                                    </Typography>
                                                )}
                                                {miembro.usuario?.cedula && (
                                                    <Typography variant="caption" component="span" color="primary" sx={{ mt: 0.5, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <BadgeIcon sx={{ fontSize: 14 }} /> Cédula: {miembro.usuario.cedula}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" component="span" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {miembro.usuario?.carrera
                                                        ? `${miembro.usuario.carrera.facultad?.nombre} - ${miembro.usuario.carrera.nombre}`
                                                        : 'Estudiante UIDE'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </Box>
                    ) : team.players && team.players.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {team.players.map((player, index) => (
                                <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
                                            {player.number}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={player.name}
                                        secondary={
                                            <Chip
                                                label={player.position}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                            />
                                        }
                                    />
                                </ListItem>
                            ))}
                        </Box>
                    ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No hay {team.miembros ? 'miembros' : 'jugadores'} registrados en este equipo.
                        </Typography>
                    )}
                </Box>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
