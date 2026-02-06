import { Trophy, Users, Shuffle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, Typography, Box, Chip, Button, Stack, IconButton } from '@mui/material';
import type { Tournament } from '../types';

interface TournamentCardProps {
    tournament: Tournament;
    onViewDetails: (tournament: Tournament) => void;
    onEdit: (tournament: Tournament) => void;
    onDelete: (tournament: Tournament) => void;
}

export function TournamentCard({ tournament, onViewDetails, onEdit, onDelete }: TournamentCardProps) {
    const getFormatText = () => {
        switch (tournament.format) {
            case 'groups':
                return 'Fase de Grupos';
            case 'knockout':
                return 'Eliminación Directa';
            case 'single-elimination':
                return 'Eliminación Simple';
            default:
                return tournament.format;
        }
    };

    const getStatusText = () => {
        switch (tournament.status) {
            case 'pending':
                return 'Pendiente';
            case 'drawn':
                return 'Sorteado';
            case 'completed':
                return 'Completado';
            default:
                return tournament.status;
        }
    };

    const getStatusColor = (): 'default' | 'primary' | 'success' | 'warning' => {
        switch (tournament.status) {
            case 'pending':
                return 'warning';
            case 'drawn':
                return 'primary';
            case 'completed':
                return 'default';
            default:
                return 'default';
        }
    };

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            transition: 'transform 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
            }
        }}>
            {/* Image Banner Section */}
            <Box sx={{ position: 'relative', height: 200, bgcolor: 'grey.200' }}>
                {tournament.image ? (
                    <Box
                        component="img"
                        src={tournament.image}
                        alt={tournament.name}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'primary.main',
                        }}
                    >
                        <Trophy size={48} color="white" style={{ opacity: 0.5 }} />
                    </Box>
                )}

                {/* Gradient Overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)'
                    }}
                />

                {/* Date Badge (Top Right) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'flex',
                        gap: 1
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: 2,
                            px: 1.5,
                            py: 0.5,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {new Date(tournament.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </Box>
                </Box>

                {/* Action Buttons (Top Right Overlay) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        display: 'flex',
                        gap: 1
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(tournament);
                        }}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'white' },
                            width: 32,
                            height: 32
                        }}
                    >
                        <Edit size={16} color="#1976d2" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(tournament);
                        }}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: '#ffebee' },
                            width: 32,
                            height: 32
                        }}
                    >
                        <Trash2 size={16} color="#d32f2f" />
                    </IconButton>
                </Box>

                {/* Status Badge & Title (Bottom Left) */}
                <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                    <Chip
                        label={getStatusText()}
                        color={getStatusColor()}
                        size="small"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            height: 24,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            border: 'none'
                        }}
                    />
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            fontWeight: 'bold',
                            color: 'white',
                            lineHeight: 1.2,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {tournament.name}
                    </Typography>
                </Box>
            </Box>

            {/* Content Section */}
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Trophy size={16} color="#2563eb" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{tournament.sport}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Users size={16} color="#2563eb" />
                        <Typography variant="body2">{tournament.teams?.length || 0} equipos inscritos</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Shuffle size={16} color="#2563eb" />
                        <Typography variant="body2">{getFormatText()}</Typography>
                    </Box>
                </Stack>

                <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => onViewDetails(tournament)}
                    sx={{
                        mt: 3,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                            borderWidth: 2
                        }
                    }}
                >
                    Ver Detalles
                </Button>
            </CardContent>
        </Card>
    );
}
