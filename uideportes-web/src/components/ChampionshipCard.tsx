
import { Trophy, Calendar, Users, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Paper, CardContent, Typography, Box, Chip, Button, IconButton, Divider, Stack } from '@mui/material';
import type { Championship, Tournament } from '../types';

interface ChampionshipCardProps {
    championship: Championship;
    onViewTournament: (tournament: Tournament) => void;
    onViewBracket: (tournament: Tournament) => void;
    onEdit: (championship: Championship) => void;
    onDelete: (championship: Championship) => void;
    onEditTournament: (tournament: Tournament) => void;
    onDeleteTournament: (tournament: Tournament) => void;
}

export function ChampionshipCard({
    championship,
    onViewTournament,
    onViewBracket,
    onEdit,
    onDelete,
    onEditTournament,
    onDeleteTournament
}: ChampionshipCardProps) {

    return (
        <Paper sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 30px 0 rgba(0, 31, 82, 0.12)'
            }
        }}>
            {/* Header Section */}
            <Box sx={{
                p: 3,
                bgcolor: '#001F52',
                color: 'white',
                position: 'relative'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ width: '80%' }}>
                        {championship.nombre}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onEdit(championship); }}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            <Edit size={16} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDelete(championship); }}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffcdd2', bgcolor: 'rgba(255,0,0,0.1)' } }}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.85rem', opacity: 0.9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} />
                        <span>{championship.anio}</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Trophy size={14} />
                        <span>{championship.torneos?.length || 0} Torneos</span>
                    </Box>
                </Box>
            </Box>

            {/* Tournaments List */}
            <CardContent sx={{ flexGrow: 1, p: 0, bgcolor: 'transparent' }}>
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="600" mb={1.5}>
                        Torneos Activos
                    </Typography>
                </Box>

                <Stack divider={<Divider sx={{ borderColor: 'rgba(0,0,0,0.04)' }} />}>
                    {championship.torneos && championship.torneos.length > 0 ? (
                        championship.torneos.map((torneo) => (
                            <Box
                                key={torneo.id}
                                sx={{
                                    p: 2,
                                    '&:hover': { bgcolor: 'rgba(0,0,50,0.02)' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold" color="#001F52">
                                            {torneo.disciplina}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {(torneo.genero || 'MIXTO').toLowerCase()} • {(torneo.categoria.replace('_', ' ') || '').toLowerCase()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex' }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onEditTournament(torneo)}
                                            sx={{ opacity: 0.6 }}
                                            title="Editar Torneo"
                                        >
                                            <Edit size={14} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => onDeleteTournament(torneo)}
                                            sx={{ opacity: 0.6, color: 'error.main' }}
                                            title="Eliminar Torneo"
                                        >
                                            <Trash2 size={14} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        onClick={() => onViewBracket(torneo)}
                                        sx={{
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            borderColor: '#e2e8f0',
                                            color: '#64748b'
                                        }}
                                    >
                                        Ver Llaves
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        fullWidth
                                        onClick={() => onViewTournament(torneo)}
                                        endIcon={<ArrowRight size={14} />}
                                        sx={{
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            bgcolor: '#001F52',
                                            '&:hover': { bgcolor: '#003366' }
                                        }}
                                    >
                                        Detalles
                                    </Button>
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                            <Typography variant="body2">No hay torneos registrados</Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Paper>
    );
}
