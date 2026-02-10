import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    MenuItem,

    CardContent,
    Chip,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    InputAdornment,
    Tabs,
    Tab,
    Menu,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Videocam as VideoIcon,
    CalendarMonth as CalendarIcon,
    Visibility as EyeIcon,
    Send as SendIcon,

    Share,
    Edit,
    Delete,
    PlayArrow,
    AdminPanelSettings,
    Block
} from '@mui/icons-material';
import type { StreamEvent, Matchup, Team } from '../types';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface StreamingSectionProps {
    streams: StreamEvent[];
    matchups: Matchup[];
    teams: Team[];
    onCreateStream: (stream: StreamEvent | Omit<StreamEvent, 'id'>) => void;
    onDeleteStream: (streamId: number) => void;
    onUpdateStatus: (streamId: number, isLive: boolean) => void;
}

interface ChatMessage {
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
    isAdmin?: boolean;
    userId?: string;
}

export function StreamingSection({ streams, matchups, teams, onCreateStream, onDeleteStream, onUpdateStatus }: StreamingSectionProps) {
    const { user } = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingStreamId, setEditingStreamId] = useState<number | null>(null);
    const [activeStreamId, setActiveStreamId] = useState<number | null>(null);
    const [selectedSport, setSelectedSport] = useState('Todos');
    const [title, setTitle] = useState('');
    const [selectedMatchupId, setSelectedMatchupId] = useState('');
    const [streamUrl, setStreamUrl] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Admin Ban Actions
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUserForBan, setSelectedUserForBan] = useState<{ id: string, name: string } | null>(null);
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [banDuration, setBanDuration] = useState(5); // minutes
    const [banReasonInput, setBanReasonInput] = useState('Comportamiento inapropiado');

    // Initialize Socket Connection
    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        socketRef.current.on('connect', () => {
            // Join default room or active stream room
            const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
            socketRef.current?.emit('join_room', room);
        });

        socketRef.current.on('update_user_count', (count: number) => setOnlineUsers(count));

        socketRef.current.on('receive_message', (data: any) => {
            const newMsg: ChatMessage = {
                id: Date.now().toString(),
                user: data.user,
                avatar: data.avatar || data.user.charAt(0).toUpperCase(),
                message: data.message,
                timestamp: new Date(data.timestamp),
                isSystem: data.isSystem,
                isAdmin: data.isAdmin,
                userId: data.userId
            };
            setChatMessages(prev => [...prev.slice(-50), newMsg]);
        });

        socketRef.current.on('user_banned', (data: { userId: string, reason: string, until: string }) => {
            const banMsg: ChatMessage = {
                id: Date.now().toString(),
                user: 'Sistema',
                avatar: 'S',
                message: `El usuario ${data.userId} ha sido baneado. Razón: ${data.reason}`,
                timestamp: new Date(),
                isSystem: true
            };
            setChatMessages(prev => [...prev.slice(-50), banMsg]);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // Handle Room Switching
    useEffect(() => {
        if (socketRef.current) {
            const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
            socketRef.current.emit('join_room', room);
            setChatMessages([]); // Clear chat on room switch? Or keep history? clearing for now.
        }
    }, [activeStreamId]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current?.parentElement) {
            chatEndRef.current.parentElement.scrollTop = chatEndRef.current.parentElement.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        if (activeStreamId && !streams.find(s => s.id === activeStreamId)) {
            setActiveStreamId(null);
        }
    }, [streams, activeStreamId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const matchup = matchups.find(m => m.id === Number(selectedMatchupId));
        if (matchup) {
            onCreateStream({
                id: editingStreamId || undefined,
                title,
                matchup,
                streamUrl,
                scheduledDate: new Date(scheduledDate),
                status: editingStreamId ? (streams.find(s => s.id === editingStreamId)?.status || 'upcoming') : 'upcoming',
                viewers: editingStreamId ? (streams.find(s => s.id === editingStreamId)?.viewers || 0) : 0,
            } as unknown as StreamEvent);
            resetForm();
        }
    };

    const resetForm = () => {
        setTitle('');
        setSelectedMatchupId('');
        setStreamUrl('');
        setScheduledDate('');
        setEditingStreamId(null);
        setShowCreateForm(false);
    };

    const handleEditClick = (stream: StreamEvent) => {
        setTitle(stream.title);
        setSelectedMatchupId(stream.matchup.id.toString());
        setStreamUrl(stream.streamUrl);
        const date = new Date(stream.scheduledDate);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setScheduledDate(date.toISOString().slice(0, 16));

        setEditingStreamId(stream.id);
        setShowCreateForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
        const messageData = {
            room,
            message: newMessage,
            user: user ? `${user.nombres} ${user.apellidos}`.trim() : 'Admin',
            userId: user?.id,
            avatar: user?.nombres?.charAt(0).toUpperCase() || 'A',
            userRole: user?.rol
        };

        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
    };

    const handleUserClick = (event: React.MouseEvent<HTMLElement>, msgUserId?: string, msgUserName?: string) => {
        if (user?.rol === 'ADMIN' && msgUserId && msgUserId !== user.id.toString()) {
            setAnchorEl(event.currentTarget);
            setSelectedUserForBan({ id: msgUserId, name: msgUserName || 'Usuario' });
        }
    };

    const handleBanUser = () => {
        if (!socketRef.current || !selectedUserForBan) return;

        socketRef.current.emit('ban_user', {
            adminId: user?.id,
            targetUserId: selectedUserForBan.id,
            durationMinutes: banDuration,
            reason: banReasonInput
        });

        setBanDialogOpen(false);
        setAnchorEl(null);
        setSelectedUserForBan(null);
        alert(`Usuario ${selectedUserForBan.name} ha sido baneado.`);
    };


    const sports = ['Todos', ...Array.from(new Set(teams.map(t => t.sport)))];

    const filteredStreams = streams.filter(stream => {
        if (selectedSport === 'Todos') return true;
        const team1 = teams.find(t => t.name === stream.matchup.team1);
        return team1?.sport === selectedSport;
    });

    const upcomingStreams = filteredStreams.filter(s => s.status === 'upcoming');
    const liveStreams = filteredStreams.filter(s => s.status === 'live');
    const featuredStream = (activeStreamId ? filteredStreams.find(s => s.id === activeStreamId) : null) || liveStreams[0] || upcomingStreams[0];

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
        const twitchRegex = /twitch\.tv\/([a-zA-Z0-9_]+)/;
        const twitchMatch = url.match(twitchRegex);
        if (twitchMatch && twitchMatch[1]) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
        return null;
    };

    const currentEmbedUrl = featuredStream ? getEmbedUrl(featuredStream.streamUrl) : null;

    return (
        <Box sx={{ pb: 4 }}>
            {/* ... Existing Headers and Forms ... */}
            {/* Reuse existing JSX essentially but updated context */}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                    UIDE Sports Live - Admin
                </Typography>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        px: 3,
                        background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
                        fontWeight: 800
                    }}
                    startIcon={<VideoIcon />}
                    onClick={() => {
                        resetForm();
                        setShowCreateForm(!showCreateForm);
                    }}
                >
                    {showCreateForm ? 'Cerrar Formulario' : 'Nueva Transmisión'}
                </Button>
            </Box>

            <Paper sx={{
                mb: 4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)',
                overflow: 'hidden'
            }}>
                <Tabs
                    value={selectedSport}
                    onChange={(_, newValue) => setSelectedSport(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            color: 'rgba(0, 31, 82, 0.6)',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            minHeight: 56,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                                color: '#001F52',
                                fontWeight: 800
                            }
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: '#EDB112',
                            height: 4,
                            borderRadius: '4px 4px 0 0'
                        }
                    }}
                >
                    {sports.map(sport => (
                        <Tab key={sport} label={sport} value={sport} />
                    ))}
                </Tabs>
            </Paper>

            {showCreateForm && (
                <Paper
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 8px 32px 0 rgba(0, 31, 82, 0.08)'
                    }}
                    component="form"
                    onSubmit={handleSubmit}
                    elevation={0}
                >
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 900, color: '#001F52', mb: 3 }}>
                        {editingStreamId ? 'Editar Evento' : 'Programar Nueva Transmisión'}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                        <TextField fullWidth label="Título del Evento" value={title} onChange={e => setTitle(e.target.value)} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                        <TextField select fullWidth label="Partido Asociado" value={selectedMatchupId} onChange={e => setSelectedMatchupId(e.target.value)} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}>
                            {matchups.map(m => <MenuItem key={m.id} value={m.id}>{m.team1} vs {m.team2}</MenuItem>)}
                        </TextField>
                        <TextField fullWidth label="URL de Transmisión (YouTube/Twitch)" value={streamUrl} onChange={e => setStreamUrl(e.target.value)} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                        <TextField fullWidth type="datetime-local" label="Fecha y Hora Programada" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} InputLabelProps={{ shrink: true }} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={resetForm} sx={{ fontWeight: 700, textTransform: 'none', color: '#64748B' }}>Cancelar</Button>
                        <Button type="submit" variant="contained" sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 4,
                            background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
                            boxShadow: '0 4px 12px rgba(0, 31, 82, 0.2)'
                        }}>
                            {editingStreamId ? 'Guardar Cambios' : 'Programar Evento'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Hero Player Section */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' },
                gap: 3,
                mb: 6,
                padding: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)'
            }}>
                {/* Main Player Area */}
                <Box>
                    {featuredStream ? (
                        <>
                            <Box key={featuredStream.id} sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                {currentEmbedUrl ? (
                                    <iframe key={featuredStream.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} src={currentEmbedUrl} title={featuredStream.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                ) : (
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', textAlign: 'center', color: 'white', p: 3 }}>
                                        <VideoIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                                        <Typography variant="h6" gutterBottom>Esta transmisión se aloja en un sitio externo</Typography>
                                        <Button variant="contained" color="error" href={featuredStream.streamUrl} target="_blank" rel="noopener noreferrer" startIcon={<EyeIcon />}>Ver Transmisión</Button>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#001F52', letterSpacing: -0.5 }}>{featuredStream.title}</Typography>
                                    <Typography variant="body1" sx={{ color: '#64748B', mb: 2, fontWeight: 500 }}>{featuredStream.matchup.team1} vs {featuredStream.matchup.team2}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {featuredStream.status === 'live' ? <Chip label="EN VIVO" color="error" size="small" sx={{ fontWeight: 800 }} /> : <Chip label="PRÓXIMAMENTE" color="primary" size="small" sx={{ fontWeight: 800 }} />}
                                        <Chip icon={<EyeIcon sx={{ color: '#001F52 !important' }} />} label={`${featuredStream.viewers || 0} espectadores`} variant="outlined" sx={{ color: '#001F52', borderColor: 'rgba(0,31,82,0.2)', fontWeight: 600 }} />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    {featuredStream.status === 'upcoming' ? (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<PlayArrow />}
                                            onClick={() => onUpdateStatus(featuredStream.id, true)}
                                            sx={{
                                                borderRadius: 1.5,
                                                bgcolor: '#EDB112',
                                                color: '#001F52',
                                                fontWeight: 900,
                                                boxShadow: '0 4px 12px rgba(237, 177, 18, 0.3)',
                                                '&:hover': { bgcolor: '#f5c64d' }
                                            }}
                                        >
                                            Iniciar Transmisión
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => onUpdateStatus(featuredStream.id, false)}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: '#EF4444',
                                                fontWeight: 900,
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                            }}
                                        >
                                            Detener
                                        </Button>
                                    )}
                                    <IconButton onClick={() => onDeleteStream(featuredStream.id)} sx={{ color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }} title="Eliminar Transmisión"><Delete /></IconButton>
                                    <IconButton sx={{ color: '#001F52', bgcolor: 'rgba(0, 31, 82, 0.05)', '&:hover': { bgcolor: 'rgba(0, 31, 82, 0.1)' } }}><Edit onClick={() => handleEditClick(featuredStream)} /></IconButton>
                                    <IconButton sx={{ color: '#001F52', bgcolor: 'rgba(0, 31, 82, 0.05)', '&:hover': { bgcolor: 'rgba(0, 31, 82, 0.1)' } }}><Share /></IconButton>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2, border: '2px dashed rgba(0,0,0,0.1)' }}>
                            <VideoIcon sx={{ fontSize: 60, color: '#CBD5E1', mb: 2 }} />
                            <Typography color="text.secondary" fontWeight={500}>No hay transmisión seleccionada</Typography>
                        </Box>
                    )}
                </Box>

                {/* Live Chat Panel */}
                <Paper sx={{ bgcolor: 'white', display: 'flex', flexDirection: 'column', height: { xs: 400, lg: 'auto' }, maxHeight: 600, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Box sx={{ p: 2, background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>Chat de Moderación</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.1)', px: 1.5, py: 0.5, borderRadius: 10 }}>
                            <Box sx={{ width: 8, height: 8, bgcolor: '#22C55E', borderRadius: '50%', boxShadow: '0 0 10px #22C55E', animation: 'pulse 2s infinite' }} />
                            <Typography variant="caption" fontWeight="800">{onlineUsers} Online</Typography>
                        </Box>
                    </Box>

                    <List sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#F8FAFC' }}>
                        {chatMessages.map((msg) => (
                            <ListItem key={msg.id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                                <ListItemAvatar sx={{ minWidth: 40, cursor: user?.rol === 'ADMIN' ? 'pointer' : 'default' }} onClick={(e) => handleUserClick(e, msg.userId, msg.user)}>
                                    <Avatar sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: msg.isSystem ? '#FEF2F2' : (msg.isAdmin ? '#FFFBEB' : 'white'),
                                        fontSize: '0.8rem',
                                        color: msg.isSystem ? '#EF4444' : (msg.isAdmin ? '#B45309' : '#001F52'),
                                        fontWeight: msg.isAdmin ? 'bold' : 'bold',
                                        border: msg.isAdmin ? '1px solid #FCD34D' : '1px solid #E2E8F0'
                                    }}>
                                        {msg.isAdmin ? <AdminPanelSettings sx={{ fontSize: 16 }} /> : (msg.avatar || 'S')}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: msg.isSystem ? '#EF4444' : (msg.isAdmin ? '#B45309' : '#001F52'), fontWeight: '800', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {msg.user}
                                                {msg.isAdmin && (
                                                    <Chip
                                                        label="MOD"
                                                        size="small"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: '0.6rem',
                                                            bgcolor: '#FFFBEB',
                                                            color: '#B45309',
                                                            fontWeight: 900,
                                                            borderRadius: 1,
                                                            border: '1px solid #FCD34D'
                                                        }}
                                                    />
                                                )}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Paper elevation={0} sx={{
                                            p: 1,
                                            mt: 0.5,
                                            borderRadius: 2,
                                            bgcolor: msg.isSystem ? '#FEF2F2' : 'white',
                                            border: '1px solid',
                                            borderColor: msg.isSystem ? '#FECACA' : '#E2E8F0',
                                            display: 'inline-block'
                                        }}>
                                            <Typography variant="body2" sx={{ color: msg.isSystem ? '#B91C1C' : '#334155', fontWeight: 500 }}>
                                                {msg.message}
                                            </Typography>
                                        </Paper>
                                    }
                                />
                            </ListItem>
                        ))}
                        <div ref={chatEndRef} />
                    </List>

                    {/* Ban Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={() => { setBanDialogOpen(true); setAnchorEl(null); }}>
                            <Block sx={{ fontSize: 18, mr: 1, color: 'error.main' }} /> Banear Usuario
                        </MenuItem>
                    </Menu>

                    {/* Ban Dialog */}
                    <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
                        <DialogTitle>Banear a {selectedUserForBan?.name}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 300 }}>
                                <TextField
                                    label="Motivo"
                                    fullWidth
                                    value={banReasonInput}
                                    onChange={(e) => setBanReasonInput(e.target.value)}
                                />
                                <TextField
                                    label="Duración (minutos)"
                                    type="number"
                                    fullWidth
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(Number(e.target.value))}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setBanDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleBanUser} color="error" variant="contained">Banear</Button>
                        </DialogActions>
                    </Dialog>

                    <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: 'white' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Di algo como Admin..."
                            size="small"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            sx={{
                                bgcolor: '#F1F5F9',
                                borderRadius: 1.5,
                                '& .MuiOutlinedInput-root': {
                                    fieldset: { border: 'none' },
                                    '&.Mui-focused fieldset': { border: '2px solid #001F52' }
                                },
                                input: { color: '#0f172a', fontWeight: 500 }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" type="submit" sx={{ color: '#001F52', '&:hover': { bgcolor: 'rgba(0,31,82,0.1)' } }}>
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                            <IconButton size="small" type="button" onClick={() => setNewMessage('🔥')} sx={{ p: 0.5, color: '#64748B', '&:hover': { color: '#001F52', bgcolor: '#F1F5F9' } }}>🔥</IconButton>
                            <IconButton size="small" type="button" onClick={() => setNewMessage('⚽')} sx={{ p: 0.5, color: '#64748B', '&:hover': { color: '#001F52', bgcolor: '#F1F5F9' } }}>⚽</IconButton>
                            <IconButton size="small" type="button" onClick={() => setNewMessage('👏')} sx={{ p: 0.5, color: '#64748B', '&:hover': { color: '#001F52', bgcolor: '#F1F5F9' } }}>👏</IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Recommended / Schedule Section */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Próximos Eventos
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {upcomingStreams.map(stream => (
                    <Paper
                        key={stream.id}
                        sx={{
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 30px 0 rgba(0, 31, 82, 0.12)'
                            }
                        }}
                    >
                        <Box sx={{ height: 140, bgcolor: '#F1F5F9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Placeholder thumbnail */}
                            <VideoIcon sx={{ fontSize: 40, color: '#CBD5E1' }} />
                            <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0, 31, 82, 0.8)', color: 'white', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 700 }}>
                                PROGRAMADO
                            </Box>
                        </Box>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="800" noWrap title={stream.title} sx={{ color: '#001F52' }}>
                                        {stream.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2, color: '#64748B', fontWeight: 500 }}>
                                        {stream.matchup.team1} vs {stream.matchup.team2}
                                    </Typography>
                                </Box>
                                <Box>
                                    {/* Play Button */}
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setActiveStreamId(stream.id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        sx={{ color: activeStreamId === stream.id ? 'success.main' : '#94A3B8', '&:hover': { color: '#001F52' }, mr: 1 }}
                                        title="Ver Transmisión"
                                    >
                                        <PlayArrow fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleEditClick(stream)} sx={{ color: '#001F52', '&:hover': { bgcolor: 'rgba(0,31,82,0.1)' } }}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => onDeleteStream(stream.id)} sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', fontSize: '0.8rem', fontWeight: 500 }}>
                                <CalendarIcon sx={{ fontSize: 16 }} />
                                {new Date(stream.scheduledDate).toLocaleDateString()} • {new Date(stream.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Box>
                        </CardContent>
                    </Paper>
                ))}

                {/* Add a "More" placeholder card */}
                <Paper sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent', border: '2px dashed #CBD5E1', boxShadow: 'none', borderRadius: 3, height: '100%', minHeight: 200 }}>
                    <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Más eventos pronto...</Typography>
                </Paper>
            </Box>

        </Box >
    );
}
