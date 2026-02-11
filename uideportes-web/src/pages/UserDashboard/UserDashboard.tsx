import React, { useState, useEffect } from 'react';
import { Box, Container, Tab, Tabs, Typography, Paper, Avatar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Button, Chip, Grid } from '@mui/material';
import {
    Home,
    Groups,
    EmojiEvents,
    Person,
    Logout,
    Videocam,
    Add as AddIcon,
    Search as SearchIcon,
    Payment as PaymentIcon,
    Badge as BadgeIcon,
    Wc as GenderIcon,
    CalendarToday as CalendarIcon,
    School as SchoolIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Header } from '../../components/Header';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserStreamingSection } from './components/UserStreamingSection';
import { streamingService } from '../../services/streaming.service';
import { teamsService, type Team } from '../../services/teams.service';
import { tournamentsService, type Campeonato, type Torneo } from '../../services/tournaments.service';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { CreateTeamModal } from '../../components/CreateTeamModal';
import { TournamentRegistrationModal } from '../../components/TournamentRegistrationModal';
import { TeamMembersModal } from '../../components/TeamMembersModal';
import { MyPayments } from '../../components/MyPayments';
import { authService } from '../../services/auth.service';
import { matchesService, type Partido } from '../../services/matches.service';
import type { StreamEvent } from '../../types';

// Custom Glass Card Component
const GlassCard = ({ children, sx, ...props }: any) => (
    <Paper
        elevation={0}
        sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.15)',
            },
            ...sx
        }}
        {...props}
    >
        {children}
    </Paper>
);

const UserOverview = ({ userTeams, activeTournaments, nextMatch, setCurrentTab }: {
    userTeams: Team[],
    activeTournaments: Campeonato[],
    nextMatch: Partido | null,
    setCurrentTab: (tab: number) => void
}) => {
    const { user } = useAuth();
    const availableTournaments = activeTournaments.filter(t => t.torneos && t.torneos.length > 0);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#001F52', mb: 1, letterSpacing: -0.5 }}>
                        Hola, {user?.nombres?.split(' ')[0]} 👋
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Bienvenido a tu panel deportivo. Aquí tienes un resumen de tu actividad.
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Stats Cards */}
                {/* Stats Cards */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, color: '#004B9B' }}><Groups sx={{ fontSize: 120 }} /></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #004B9B 0%, #0080FF 100%)',
                                boxShadow: '0 4px 12px rgba(0, 75, 155, 0.2)',
                                display: 'flex'
                            }}>
                                <Groups sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Mis Equipos</Typography>
                        </Box>
                        <Typography variant="h2" fontWeight="900" sx={{ mb: 1, color: '#004B9B' }}>{userTeams.length}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500, color: 'text.secondary' }}>Equipos deportivos activos</Typography>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, color: '#EDB112' }}><EmojiEvents sx={{ fontSize: 120 }} /></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
                                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                                display: 'flex'
                            }}>
                                <EmojiEvents sx={{ fontSize: 32, color: '#001F52' }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Torneos</Typography>
                        </Box>
                        <Typography variant="h2" fontWeight="900" sx={{ mb: 1, color: '#001F52' }}>{availableTournaments.length}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500, color: 'text.secondary' }}>Competencias disponibles</Typography>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, color: '#EF4444' }}><Videocam sx={{ fontSize: 120 }} /></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #EF4444 0%, #FF5252 100%)',
                                boxSizing: 'border-box',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                display: 'flex',
                                position: 'relative'
                            }}>
                                <Videocam sx={{ fontSize: 32, color: 'white' }} />
                                <Box sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: '#22C55E',
                                    border: '2px solid white',
                                    animation: 'pulse 2s infinite'
                                }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Streaming</Typography>
                        </Box>
                        <Typography variant="h2" fontWeight="900" sx={{ mb: 1, color: '#EF4444' }}>Live</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500, color: 'text.secondary' }}>Canchas en directo</Typography>
                    </GlassCard>
                </Grid>

                {/* Quick Actions / Featured */}
                <Grid size={{ xs: 12 }}>
                    <GlassCard sx={{ p: 4, mt: 2 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                            Novedades
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: '#001F52' }} />
                                    <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                                        Tu Próximo Partido
                                    </Typography>

                                    {nextMatch ? (
                                        <>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', my: 2 }}>
                                                {/* Local Team */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flex: 1 }}>
                                                    <Avatar src={nextMatch.equipoLocal?.logoUrl || undefined} sx={{ width: 56, height: 56, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #fff' }}>{nextMatch.equipoLocal?.nombre.substring(0, 2)}</Avatar>
                                                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', textAlign: 'center', fontSize: '0.85rem' }}>{nextMatch.equipoLocal?.nombre}</Typography>
                                                </Box>

                                                {/* VS */}
                                                <Typography variant="h5" fontWeight="900" sx={{ color: '#EDB112', opacity: 0.3, mx: 1 }}>VS</Typography>

                                                {/* Visitor Team */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flex: 1 }}>
                                                    <Avatar src={nextMatch.equipoVisitante?.logoUrl || undefined} sx={{ width: 56, height: 56, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #fff', bgcolor: 'secondary.main' }}>{nextMatch.equipoVisitante?.nombre.substring(0, 2)}</Avatar>
                                                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', textAlign: 'center', fontSize: '0.85rem' }}>{nextMatch.equipoVisitante?.nombre}</Typography>
                                                </Box>
                                            </Box>

                                            <Chip
                                                label={`${new Date(nextMatch.fechaHora).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })} • ${new Date(nextMatch.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`}
                                                sx={{ mb: 1, fontWeight: 800, borderRadius: 2, px: 1, textTransform: 'capitalize', bgcolor: '#001F52', color: 'white' }}
                                                size="small"
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                📍 {nextMatch.cancha?.nombre || 'Cancha por definir'}
                                            </Typography>
                                        </>
                                    ) : (
                                        <Box sx={{ py: 3, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">No tienes partidos programados.</Typography>
                                            <Button size="small" sx={{ mt: 1, textTransform: 'none' }} onClick={() => setCurrentTab(1)}>Ver mis equipos</Button>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: '#EDB112' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <EmojiEventsIcon sx={{ fontSize: 40, color: '#EDB112', mr: 2, p: 1, bgcolor: 'rgba(237, 177, 18, 0.1)', borderRadius: '50%' }} />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">Inscripciones Abiertas</Typography>
                                            <Typography variant="caption" color="text.secondary">¡No te quedes fuera!</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Hay nuevos torneos disponibles esperando por tu equipo using.
                                    </Typography>
                                    <Button variant="outlined" color="warning" size="small" fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }} onClick={() => setCurrentTab(2)}>
                                        Ver Torneos Disponibles
                                    </Button>
                                </Paper>
                            </Grid>
                        </Grid>
                    </GlassCard>
                </Grid>
            </Grid>
        </Box>
    );
};

const UserTeams = ({
    teams,
    availableTeams,
    onCreateClick,
    onJoinClick,
    onLeaveClick,
    onViewMembers,
    onRefresh
}: {
    teams: Team[],
    availableTeams: Team[],
    onCreateClick: () => void,
    onJoinClick: (id: number) => void,
    onLeaveClick: (id: number) => void,
    onViewMembers: (id: number) => void,
    onRefresh: () => void
}) => {
    const [subTab, setSubTab] = useState(0);
    const { user } = useAuth();

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="900" color="#001F52">Gestión de Equipos</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{ color: '#001F52' }}
                    >
                        Actualizar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateClick}
                        sx={{ px: 3 }}
                    >
                        Crear Equipo
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ mb: 4, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <Tabs
                    value={subTab}
                    onChange={(_, v) => setSubTab(v)}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '0.9rem', minHeight: 60 },
                        '& .MuiTabs-indicator': { height: 4, bgcolor: '#EDB112', borderRadius: '4px 4px 0 0' }
                    }}
                >
                    <Tab label="Mis Equipos" />
                    <Tab label="Explorar Equipos" icon={<SearchIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {subTab === 0 && (
                <Box>
                    {teams.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)', bgcolor: '#fff' }}>
                            <Groups sx={{ fontSize: 60, color: '#001F52', opacity: 0.1, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="700">No perteneces a ningún equipo aún.</Typography>
                            <Button variant="outlined" sx={{ mt: 2, borderRadius: 2.5, fontWeight: 700, borderColor: '#001F52', color: '#001F52' }} onClick={() => setSubTab(1)}>Buscar Equipo</Button>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {teams.map((team, index) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
                                    <GlassCard sx={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}>
                                        <Box sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                <Avatar src={team.logoUrl || undefined} sx={{ width: 64, height: 64, bgcolor: '#001F52', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                    {team.nombre.substring(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="900" color="#001F52">{team.nombre}</Typography>
                                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                        Capitán: {team.capitan?.nombres} {team.capitan?.apellidos}
                                                    </Typography>
                                                    {team.capitan?.carrera && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                                                            {team.capitan.carrera.facultad?.nombre} - {team.capitan.carrera.nombre}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Chip label="Miembro Activo" size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: 'none' }} />
                                                {user?.id !== team.capitanId && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => onLeaveClick(team.id)}
                                                        sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                                                    >
                                                        Abandonar
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => onViewMembers(team.id)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        borderRadius: 1.5,
                                                        borderColor: 'rgba(0,31,82,0.2)',
                                                        color: '#001F52',
                                                        '&:hover': {
                                                            borderColor: '#001F52',
                                                            bgcolor: 'rgba(0,31,82,0.02)'
                                                        }
                                                    }}
                                                >
                                                    Ver Miembros
                                                </Button>
                                            </Box>
                                        </Box>
                                    </GlassCard>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {subTab === 1 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Equipos Disponibles</Typography>
                    {availableTeams.length === 0 ? (
                        <GlassCard sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary" fontWeight="500">No hay equipos disponibles por el momento.</Typography>
                        </GlassCard>
                    ) : (
                        <Grid container spacing={3}>
                            {availableTeams.map((team, index) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
                                    <GlassCard sx={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}>
                                        <Box sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                <Avatar src={team.logoUrl || undefined} sx={{ width: 56, height: 56, bgcolor: '#f1f5f9', color: '#001F52', border: '1px solid rgba(0,31,82,0.1)' }}>
                                                    {team.nombre.substring(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="800" color="#001F52">{team.nombre}</Typography>
                                                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                                                        {team.disciplina}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                fullWidth
                                                onClick={() => onJoinClick(team.id)}
                                            >
                                                Unirse al Equipo
                                            </Button>
                                        </Box>
                                    </GlassCard>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}
        </Box>
    );
};

const UserTournaments = ({
    tournaments,
    userTeams,
    onRegisterClick,
    onViewBracket,
    onRefresh
}: {
    tournaments: Campeonato[],
    userTeams: Team[],
    onRegisterClick: (torneo: Torneo) => void,
    onViewBracket: (id: number) => void,
    onRefresh: () => void
}) => {
    const activeChampionships = tournaments.filter(t => t.torneos && t.torneos.length > 0);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#001F52' }}>Torneos Activos</Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={onRefresh}
                    sx={{ color: '#001F52' }}
                >
                    Actualizar
                </Button>
            </Box>
            {activeChampionships.length === 0 ? (
                <GlassCard sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No hay torneos activos en este momento.</Typography>
                </GlassCard>
            ) : (
                <Grid container spacing={4}>
                    {activeChampionships.map((camp, index) => (
                        <Grid size={{ xs: 12, md: 6 }} key={camp.id}>
                            <GlassCard sx={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards`, p: 0, overflow: 'hidden', border: '1px solid rgba(0,31,82,0.1)' }}>
                                <Box sx={{
                                    p: 4,
                                    background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(237, 177, 18, 0.15)' }} />
                                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                                        <Typography variant="h5" fontWeight="800" gutterBottom sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>{camp.nombre}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={`Inicio: ${new Date(camp.fechaInicio).toLocaleDateString()} `}
                                                size="small"
                                                icon={<EmojiEvents sx={{ fontSize: 16, color: 'white !important' }} />}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontWeight: 600 }}
                                            />
                                            <Chip
                                                label={`${camp.torneos?.length} Categorías`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 500 }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 3, bgcolor: '#fff' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {camp.torneos?.map(t => (
                                            <Box key={t.id} sx={{
                                                p: 2,
                                                bgcolor: '#f8f9fa',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                border: '1px solid #eef2f6',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateX(4px)',
                                                    borderColor: '#90caf9',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                }
                                            }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="800" color="primary.dark" sx={{ fontSize: '0.95rem' }}>
                                                        {t.disciplina}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#546e7a', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 500 }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff9800', display: 'inline-block' }}></span>
                                                        {t.categoria} • {t.genero}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => {
                                                            // Check if draw is made
                                                            if ((t as any).status === 'pending') {
                                                                alert('El sorteo de llaves aún no se ha realizado. Por favor, espere a que el administrador genere los cruces.');
                                                            } else {
                                                                onViewBracket(t.id);
                                                            }
                                                        }}
                                                        sx={{ color: '#001F52', fontWeight: 800, fontSize: '0.8rem', '&:hover': { color: '#EDB112', bgcolor: 'rgba(237, 177, 18, 0.05)' } }}
                                                    >
                                                        Ver Partidos
                                                    </Button>
                                                    {(() => {
                                                        const myRegistration = t.inscripciones?.find(i => userTeams.some(ut => ut.id === i.equipoId));

                                                        if (myRegistration) {
                                                            let label = 'Inscrito';
                                                            let color = '#4caf50'; // Green

                                                            if (myRegistration.estado === 'PENDIENTE_PAGO') {
                                                                label = 'Pago Pendiente';
                                                                color = '#ff9800'; // Orange
                                                            } else if (myRegistration.estado === 'PAGO_EN_REVISION') {
                                                                label = 'En Revisión';
                                                                color = '#2196f3'; // Blue
                                                            } else if (myRegistration.estado === 'RECHAZADO') {
                                                                label = 'Rechazado';
                                                                color = '#f44336'; // Red
                                                            }

                                                            return (
                                                                <Chip
                                                                    label={label}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: color,
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        height: 32
                                                                    }}
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                disableElevation
                                                                onClick={() => onRegisterClick(t)}
                                                            >
                                                                Inscribirse
                                                            </Button>
                                                        );
                                                    })()}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </GlassCard>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

const PromoteToCaptain = () => {
    const { logout } = useAuth();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handlePromote = async () => {
        if (!confirm("¿Estás seguro de que quieres ascender a Capitán? Esto te permitirá crear y gestionar equipos. Deberás iniciar sesión nuevamente.")) return;

        setLoading(true);
        try {
            await authService.promoteToCaptain();
            showNotification("¡Felicidades! Ahora eres Capitán. Por favor inicia sesión nuevamente.", "success");
            logout();
        } catch (error: any) {
            console.error(error);
            showNotification(error.response?.data?.message || "Error al solicitar ascenso.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="contained"
            color="secondary"
            onClick={handlePromote}
            disabled={loading}
            sx={{
                py: 1.5,
                px: 4,
                borderRadius: 3,
                fontWeight: 'bold',
                background: '#fff',
                color: '#263238',
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                border: 'none',
                '&:hover': {
                    background: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                },
                transition: 'all 0.2s'
            }}
        >
            {loading ? 'Procesando...' : 'Ascender ahora'}
        </Button>
    );
};

const UserProfile = () => {
    const { user } = useAuth();
    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 900, textAlign: 'center', color: '#001F52', letterSpacing: -0.5 }}>Mi Perfil</Typography>
            <GlassCard sx={{ p: { xs: 3, md: 5 }, maxWidth: 800, mx: 'auto', position: 'relative', overflow: 'visible' }}>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 180,
                    background: 'linear-gradient(180deg, rgba(0, 75, 155, 0.08) 0%, rgba(255,255,255,0) 100%)',
                    zIndex: 0
                }} />

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 6 }, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    {/* Left Column: Avatar & Role */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: { xs: '100%', md: 200 }, flexShrink: 0 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar sx={{
                                width: 150,
                                height: 150,
                                bgcolor: '#004B9B',
                                fontSize: '4rem',
                                boxShadow: '0 12px 24px rgba(0, 75, 155, 0.25)',
                                border: '4px solid white',
                                fontWeight: 700
                            }}>
                                {user?.nombres?.charAt(0)}
                            </Avatar>
                            <Box sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                width: 20,
                                height: 20,
                                bgcolor: '#22C55E',
                                borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </Box>
                        <Chip
                            label={user?.rol}
                            sx={{
                                px: 3,
                                py: 2.5,
                                borderRadius: 3,
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                width: '100%',
                                color: '#001F52',
                                background: 'linear-gradient(135deg, #EDB112 0%, #FFC107 100%)',
                                boxShadow: '0 4px 12px rgba(237, 177, 18, 0.3)',
                                border: 'none'
                            }}
                        />
                    </Box>

                    {/* Right Column: Details */}
                    <Box sx={{ flex: 1, width: '100%', pt: 1 }}>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, mb: 4 }}>
                            <Typography variant="h3" fontWeight="900" sx={{ color: '#001F52', fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1.1, mb: 0.5 }}>
                                {user?.nombres} {user?.apellidos}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" fontWeight="500" sx={{ fontSize: '1rem', opacity: 0.8 }}>
                                {user?.email}
                            </Typography>
                        </Box>

                        <Paper elevation={0} sx={{ p: 0, bgcolor: 'transparent', borderRadius: 0 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: 'rgba(0, 75, 155, 0.03)', border: '1px solid rgba(0, 75, 155, 0.05)' }}>
                                        <BadgeIcon sx={{ color: '#004B9B', fontSize: 24 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 0.5, display: 'block' }}>CÉDULA</Typography>
                                            <Typography variant="body1" fontWeight="700" color="#001F52">{user?.cedula || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: 'rgba(0, 75, 155, 0.03)', border: '1px solid rgba(0, 75, 155, 0.05)' }}>
                                        <GenderIcon sx={{ color: '#004B9B', fontSize: 24 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 0.5, display: 'block' }}>GÉNERO</Typography>
                                            <Typography variant="body1" fontWeight="700" color="#001F52">{user?.genero || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: 'rgba(0, 75, 155, 0.03)', border: '1px solid rgba(0, 75, 155, 0.05)' }}>
                                        <SchoolIcon sx={{ color: '#004B9B', fontSize: 24 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 0.5, display: 'block' }}>CARRERA</Typography>
                                            <Typography variant="body1" fontWeight="700" color="#001F52" sx={{ lineHeight: 1.2 }}>{user?.carrera?.nombre || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: 'rgba(0, 75, 155, 0.03)', border: '1px solid rgba(0, 75, 155, 0.05)' }}>
                                        <CalendarIcon sx={{ color: '#004B9B', fontSize: 24 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 0.5, display: 'block' }}>MIEMBRO DESDE</Typography>
                                            <Typography variant="body1" fontWeight="700" color="#001F52">
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) : 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {user?.rol === 'ESTUDIANTE' && (
                            <Box sx={{
                                mt: 4,
                                p: 3,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #001F52 0%, #004B9B 100%)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                gap: 3,
                                boxShadow: '0 8px 24px rgba(0, 75, 155, 0.25)'
                            }}
                            >
                                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                                <Box sx={{ position: 'absolute', bottom: -20, left: 20, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

                                <Box sx={{ flex: 1, position: 'relative', zIndex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                                    <Typography variant="h6" fontWeight="800" sx={{ color: '#fff', mb: 0.5 }}>
                                        ¿Quieres ser Capitán? 🚀
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, fontSize: '0.85rem' }}>
                                        Crea equipos, inscribe jugadores y lidera en los torneos.
                                    </Typography>
                                </Box>
                                <Box sx={{ width: { xs: '100%', sm: 'auto' }, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <PromoteToCaptain />
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </GlassCard>
        </Box>
    );
};

const menuItems = [
    { id: 0, label: 'Inicio', icon: Home },
    { id: 1, label: 'Equipos', icon: Groups },
    { id: 2, label: 'Torneos', icon: EmojiEvents },
    { id: 3, label: 'Streaming', icon: Videocam },
    { id: 4, label: 'Mis Pagos', icon: PaymentIcon },
    { id: 5, label: 'Mi Perfil', icon: Person },
];

export const UserDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();

    // Map tab names to IDs
    const tabMap: Record<string, number> = {
        'inicio': 0,
        'equipos': 1,
        'torneos': 2,
        'streaming': 3,
        'pagos': 4,
        'perfil': 5
    };

    const reverseTabMap: Record<number, string> = Object.fromEntries(
        Object.entries(tabMap).map(([k, v]) => [v, k])
    );

    // Initial state from URL
    const initialTab = searchParams.get('tab');
    const [currentTab, setCurrentTab] = useState<number>(
        initialTab && tabMap[initialTab] !== undefined ? tabMap[initialTab] : 0
    );

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sync state with URL when tab changes
    useEffect(() => {
        const tabName = reverseTabMap[currentTab];
        if (tabName && searchParams.get('tab') !== tabName) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('tab', tabName);
                return newParams;
            }, { replace: true });
        }
    }, [currentTab, setSearchParams]);

    // Sync state if URL changes externally (back/forward button)
    useEffect(() => {
        const tabName = searchParams.get('tab');
        if (tabName && tabMap[tabName] !== undefined && tabMap[tabName] !== currentTab) {
            setCurrentTab(tabMap[tabName]);
        }
    }, [searchParams]);


    // Data States
    const [streams, setStreams] = useState<StreamEvent[]>([]);
    const [userTeams, setUserTeams] = useState<Team[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [tournaments, setTournaments] = useState<Campeonato[]>([]);
    const [nextMatch, setNextMatch] = useState<Partido | null>(null);

    // UI States
    const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [selectedTournamentForRegistration, setSelectedTournamentForRegistration] = useState<Torneo | null>(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);

    const loadData = async () => {
        try {
            const [myTeams, availTeams, camps, nextM] = await Promise.all([
                teamsService.getUserTeams(),
                teamsService.getAvailableTeams(),
                tournamentsService.getCampeonatos(),
                matchesService.getNextMatch()
            ]);
            setUserTeams(myTeams);
            setAvailableTeams(availTeams.filter(t => !myTeams.some(mt => mt.id === t.id)));
            setTournaments(camps);
            setNextMatch(nextM);
        } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (currentTab === 3) {
            streamingService.getStreams().then(setStreams).catch(console.error);
        }
    }, [currentTab]);

    const handleCreateTeam = async (teamData: any) => {
        try {
            await teamsService.create(teamData);
            // Reload teams
            const [myTeams, availTeams] = await Promise.all([
                teamsService.getUserTeams(),
                teamsService.getAvailableTeams()
            ]);
            setUserTeams(myTeams);
            setAvailableTeams(availTeams.filter(t => !myTeams.some(mt => mt.id === t.id)));
            showNotification("Equipo creado exitosamente", "success");
        } catch (error) {
            console.error("Error al crear equipo:", error);
            showNotification("Error al crear equipo", "error");
        }
    };

    const handleJoinTeam = async (teamId: number) => {
        const code = prompt("Si el equipo requiere código de acceso, favor ingrésalo aquí:");

        try {
            await teamsService.joinTeam(teamId, code || undefined);
            // Reload teams
            const [myTeams, availTeams] = await Promise.all([
                teamsService.getUserTeams(),
                teamsService.getAvailableTeams()
            ]);
            setUserTeams(myTeams);
            setAvailableTeams(availTeams.filter(t => !myTeams.some(mt => mt.id === t.id)));
            showNotification("Te has unido al equipo exitosamente", "success");
        } catch (error) {
            console.error("Error al unirse al equipo:", error);
            showNotification("Error al unirse al equipo (quizás ya eres miembro)", "error");
        }
    };

    const handleLeaveTeam = async (teamId: number) => {
        if (!confirm("¿Estás seguro de que quieres salir del equipo?")) return;

        try {
            await teamsService.leaveTeam(teamId);
            // Reload teams
            const [myTeams, availTeams] = await Promise.all([
                teamsService.getUserTeams(),
                teamsService.getAvailableTeams()
            ]);
            setUserTeams(myTeams);
            setAvailableTeams(availTeams.filter(t => !myTeams.some(mt => mt.id === t.id)));
            showNotification("Has salido del equipo exitosamente", "success");
        } catch (error: any) {
            console.error("Error al salir del equipo:", error);
            showNotification(error.response?.data?.message || "Error al salir del equipo", "error");
        }
    };

    const handleViewMembers = async (teamId: number) => {
        try {
            const teamData = await teamsService.getById(teamId);
            setSelectedTeamForMembers(teamData);
            setIsMembersModalOpen(true);
        } catch (error) {
            console.error("Error al obtener miembros del equipo:", error);
            showNotification("Error al cargar los miembros del equipo", "error");
        }
    };

    const handleRegisterClick = (torneo: Torneo) => {
        setSelectedTournamentForRegistration(torneo);
        setIsRegistrationModalOpen(true);
    };

    const handleViewBracket = (tournamentId: number) => {
        navigate(`/dashboard/torneos/${tournamentId}/bracket`);
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>

            <Header onMenuClick={() => setSidebarOpen(true)} />

            <Drawer
                anchor="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        background: 'linear-gradient(160deg, #001F52 0%, #001438 100%)',
                        color: 'white',
                        borderRight: '1px solid rgba(255,255,255,0.05)'
                    }
                }}
            >
                <Box sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 900,
                            color: '#EDB112', // Gold title
                            letterSpacing: 1,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        UIDE PORTES
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, fontWeight: 700 }}>
                        UNIVERSIDAD INTERNACIONAL
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />
                <List sx={{ px: 2, mt: 3 }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    onClick={() => { setCurrentTab(item.id); setSidebarOpen(false); }}
                                    sx={{
                                        borderRadius: 3,
                                        py: 1.5,
                                        transition: 'all 0.2s',
                                        backgroundColor: isActive ? 'rgba(237, 177, 18, 0.15)' : 'transparent',
                                        backdropFilter: isActive ? 'blur(10px)' : 'none',
                                        borderLeft: isActive ? '4px solid #EDB112' : '4px solid transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', transform: 'translateX(5px)' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#EDB112' : 'rgba(255,255,255,0.7)' }}><Icon /></ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isActive ? 800 : 500,
                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                    {isActive && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EDB112', boxShadow: '0 0 8px #EDB112' }} />}
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ p: 2, pb: 4 }}>
                    <Button
                        onClick={handleLogout}
                        fullWidth
                        startIcon={<Logout />}
                        sx={{
                            borderRadius: 3,
                            py: 1.5,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#ef5350' }
                        }}>
                        Cerrar Sesión
                    </Button>
                </Box>
            </Drawer>

            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>

                {/* Mobile Tabs */}
                <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', bgcolor: 'white', display: { xs: 'block', md: 'none' } }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ '& .MuiTab-root': { minHeight: 64 } }}
                    >
                        {menuItems.map(item => <Tab key={item.id} icon={<item.icon />} label={item.label} />)}
                    </Tabs>
                </Paper>

                {/* Desktop Tabs (Optional styled tabs or hidden if sidebar is preferred, keeping tabs for now) */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, mb: 4 }}>
                    <Paper elevation={0} sx={{ borderRadius: 4, p: 0.5, bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', display: 'inline-flex' }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, bgcolor: '#001F52', boxShadow: '0 4px 12px rgba(0,31,82,0.2)', zIndex: 0 },
                                '& .MuiTab-root': { zIndex: 1, minHeight: 48, borderRadius: 3, mx: 0.5, transition: 'all 0.3s', '&.Mui-selected': { color: '#EDB112' } }
                            }}
                        >
                            {menuItems.map(item => <Tab key={item.id} label={item.label} sx={{ fontWeight: 600, px: 3 }} />)}
                        </Tabs>
                    </Paper>
                </Box>

                <Box sx={{ py: 1 }}>
                    {currentTab === 0 && <UserOverview userTeams={userTeams} activeTournaments={tournaments} nextMatch={nextMatch} setCurrentTab={setCurrentTab} />}
                    {currentTab === 1 && (
                        <UserTeams
                            teams={userTeams}
                            availableTeams={availableTeams}
                            onCreateClick={() => setCreateTeamModalOpen(true)}
                            onJoinClick={handleJoinTeam}
                            onLeaveClick={handleLeaveTeam}
                            onViewMembers={handleViewMembers}
                            onRefresh={loadData}
                        />
                    )}
                    {currentTab === 2 && (
                        <UserTournaments
                            tournaments={tournaments}
                            userTeams={userTeams}
                            onRegisterClick={handleRegisterClick}
                            onViewBracket={handleViewBracket}
                            onRefresh={loadData}
                        />
                    )}
                    {currentTab === 3 && (
                        <UserStreamingSection
                            streams={streams}
                            onLikeUpdate={(streamId, newLikes) => {
                                setStreams(prev => prev.map(s => s.id === streamId ? { ...s, likes: newLikes } : s));
                            }}
                        />
                    )}
                    {currentTab === 4 && <MyPayments userId={user?.id || 0} />}
                    {currentTab === 5 && <UserProfile />}
                </Box>
            </Container>

            <CreateTeamModal
                isOpen={createTeamModalOpen}
                onClose={() => setCreateTeamModalOpen(false)}
                onCreateTeam={handleCreateTeam}
            />

            <TournamentRegistrationModal
                isOpen={isRegistrationModalOpen}
                onClose={() => setIsRegistrationModalOpen(false)}
                tournament={selectedTournamentForRegistration}
                userTeams={userTeams}
                onSuccess={loadData}
            />

            <TeamMembersModal
                open={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                team={selectedTeamForMembers}
            />
        </Box>
    );
};
