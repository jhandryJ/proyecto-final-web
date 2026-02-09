import {
    Paper,
    CardContent,
    Typography,
    Box,
    Avatar,
    Stack,
    Button,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import type { Team } from '../types';

// Add onEdit to interface
interface TeamCardProps {
    team: Team;
    onViewDetails: (team: Team) => void;
    onDelete: (team: Team) => void;
    onEdit?: (team: Team) => void;
}

export function TeamCard({ team, onViewDetails, onDelete, onEdit }: TeamCardProps) {
    const totalGames = (team.wins || 0) + (team.losses || 0) + (team.draws || 0);
    const winRate = totalGames > 0 ? ((team.wins || 0) / totalGames) * 100 : 0;

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px 0 rgba(0, 31, 82, 0.12)'
                }
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                        <Avatar
                            src={team.logoUrl}
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: team.color || team.logoUrl ? 'transparent' : 'primary.main',
                                fontWeight: 'bold',
                                fontSize: 20
                            }}
                        >
                            {!team.logoUrl && (team.nombre || team.name || '').charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                {team.nombre || team.name}
                            </Typography>
                            {team.capitan && (
                                <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 'bold', mt: 0.5 }}>
                                    Capitán: {team.capitan.nombres} {team.capitan.apellidos}
                                </Typography>
                            )}
                            {team.capitan?.carrera && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                    {team.capitan.carrera.facultad?.nombre} - {team.capitan.carrera.nombre}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Box>

                {/* Stats Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 3, textAlign: 'center' }}>
                    <Box>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                            {team.wins || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Victorias
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="h5" color="text.secondary" fontWeight="bold">
                            {team.draws || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Empates
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="h5" color="error.main" fontWeight="bold">
                            {team.losses || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Derrotas
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Detailed Stats */}
                <Stack spacing={1} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {team.sport === 'Fútbol' ? 'Goles a favor' : 'Puntos a favor'}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2" fontWeight="medium">
                                {team.goalsFor || 0}
                            </Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {team.sport === 'Fútbol' ? 'Goles en contra' : 'Puntos en contra'}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            <Typography variant="body2" fontWeight="medium">
                                {team.goalsAgainst || 0}
                            </Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {team.miembros ? 'Miembros' : 'Jugadores'}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <GroupIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight="medium">
                                {team.miembros?.length || team.players?.length || 0}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>

                {/* Win Rate */}
                {totalGames > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Efectividad
                            </Typography>
                            <Typography variant="caption" fontWeight="medium">
                                {winRate.toFixed(0)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={winRate}
                            color="success"
                            sx={{ height: 8, borderRadius: 1 }}
                        />
                    </Box>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => onViewDetails(team)}
                        size="small"
                    >
                        Ver
                    </Button>
                    {onEdit && (
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => onEdit(team)}
                            size="small"
                        >
                            Editar
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => onDelete(team)}
                        size="small"
                        sx={{ minWidth: 'auto' }}
                    >
                        X
                    </Button>
                </Stack>
            </CardContent>
        </Paper>
    );
}
