import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    InputAdornment,
    TextField,
    Grid,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import {
    Videocam as VideoIcon,
    CalendarMonth as CalendarIcon,
    Visibility as EyeIcon,
    Send as SendIcon,
    ThumbUp,
    Share,
    PlayArrow,
    LiveTv,
    AdminPanelSettings,
    Block,
    DeleteSweep as ClearChatIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import type { StreamEvent } from '../../../types';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { streamingService } from '../../../services/streaming.service';

// Reusing GlassCard style locally for self-containment 
const GlassCard = ({ children, sx, ...props }: any) => (
    <Paper
        elevation={0}
        sx={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease-in-out',
            overflow: 'hidden',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px 0 rgba(0, 0, 0, 0.08)',
            },
            ...sx
        }}
        {...props}
    >
        {children}
    </Paper>
);

interface UserStreamingSectionProps {
    streams: StreamEvent[];
    onLikeUpdate?: (streamId: number, newLikes: number) => void;
    onRefresh?: () => void;
}

interface ChatMessage {
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
    isAdmin?: boolean;
    userId?: string; // Needed for ban action
}

export function UserStreamingSection({ streams, onLikeUpdate, onRefresh }: UserStreamingSectionProps) {
    const { user } = useAuth();
    const [activeStreamId, setActiveStreamId] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Ban State
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState<string | null>(null);
    const [banUntil, setBanUntil] = useState<Date | null>(null);

    // Admin Ban Actions
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUserForBan, setSelectedUserForBan] = useState<{ id: string, name: string } | null>(null);
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [banDuration, setBanDuration] = useState(10);
    const [banReasonInput, setBanReasonInput] = useState('Comportamiento inapropiado');

    // Socket Connection Management
    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        socketRef.current.on('connect', () => {
            console.log('Conectado al servidor de socket');
            const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
            socketRef.current?.emit('join_room', { room, userId: user?.id });
        });

        socketRef.current.on('update_user_count', (count: number) => {
            setOnlineUsers(count);
        });

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

        socketRef.current.on('ban_notification', (data: { reason: string, until: string }) => {
            setIsBanned(true);
            setBanReason(data.reason);
            setBanUntil(new Date(data.until));
            setNewMessage('');
        });

        socketRef.current.on('user_banned', (data: { userId: string, reason: string, until: string }) => {
            if (user && user.id.toString() === data.userId) {
                setIsBanned(true);
                setBanReason(data.reason);
                setBanUntil(new Date(data.until));
                setNewMessage('');
            }
        });

        socketRef.current.on('stream_liked', (data: { streamId: number, likes: number }) => {
            if (onLikeUpdate) {
                onLikeUpdate(data.streamId, data.likes);
            }
        });

        socketRef.current.on('chat_cleared', () => {
            setChatMessages([]);
        });

        // initial room join
        const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
        loadChatHistory(room);

        // Pre-initialize ban from user profile
        if (user?.chatBannedUntil) {
            const until = new Date(user.chatBannedUntil);
            if (until > new Date()) {
                setIsBanned(true);
                setBanReason(user.chatBanReason || 'Sanción disciplinaria');
                setBanUntil(until);
            }
        }

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, activeStreamId, onLikeUpdate]);

    const loadChatHistory = async (sala: string) => {
        try {
            const history = await streamingService.getChatHistory(sala);
            const mappedMessages: ChatMessage[] = history.map((h: any) => ({
                id: h.id.toString(),
                user: `${h.usuario.nombres} ${h.usuario.apellidos}`,
                avatar: h.usuario.nombres.charAt(0).toUpperCase(),
                message: h.mensaje,
                timestamp: new Date(h.fecha),
                isAdmin: h.usuario.rol === 'ADMIN',
                userId: h.usuarioId.toString()
            }));
            setChatMessages(mappedMessages);
        } catch (error) {
            console.error('Error al cargar historial de chat:', error);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current?.parentElement) {
            chatEndRef.current.parentElement.scrollTop = chatEndRef.current.parentElement.scrollHeight;
        }
    }, [chatMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current || isBanned) return;

        const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
        const messageData = {
            room,
            message: newMessage,
            user: user ? `${user.nombres} ${user.apellidos}`.trim() : 'Anonimo',
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
    };

    const handleClearChat = () => {
        if (!socketRef.current || user?.rol !== 'ADMIN') return;
        if (!confirm('¿Estás seguro de que quieres borrar TODOS los mensajes del chat? Esta acción no se puede deshacer.')) return;

        const room = activeStreamId ? `stream-${activeStreamId}` : 'general';
        socketRef.current.emit('clear_chat', {
            adminId: user.id,
            room
        });
    };

    const handleLike = () => {
        const featured = streams.find(s => s.id === activeStreamId) || streams.find(s => s.status === 'live') || streams[0];
        if (!featured || !socketRef.current) return;
        socketRef.current.emit('like_stream', { streamId: featured.id, userId: user?.id });
    };

    const handleShare = (stream: StreamEvent) => {
        const shareUrl = `${window.location.origin}/dashboard?tab=streaming&streamId=${stream.id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('¡Enlace copiado al portapapeles!');
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1`;

        const twitchRegex = /twitch\.tv\/([a-zA-Z0-9_]+)/;
        const twitchMatch = url.match(twitchRegex);
        if (twitchMatch && twitchMatch[1]) {
            return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}&autoplay=true&muted=true`;
        }
        return null;
    };

    const upcomingStreams = streams.filter(s => s.status === 'upcoming');
    const liveStreams = streams.filter(s => s.status === 'live');
    const featuredStream = (activeStreamId ? streams.find(s => s.id === activeStreamId) : null) || liveStreams[0] || upcomingStreams[0];
    const currentEmbedUrl = featuredStream ? getEmbedUrl(featuredStream.streamUrl) : null;

    return (
        <Box sx={{ pb: 4, animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar sx={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    width: 56,
                    height: 56,
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                }}>
                    <LiveTv />
                </Avatar>
                <Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: '#001F52', letterSpacing: -1 }}>
                        UIDE Sports Live
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="600" sx={{ opacity: 0.8 }}>
                        Transmisión oficial universitaria en alta definición
                        Transmisión oficial universitaria en alta definición
                    </Typography>
                </Box>
                {onRefresh && (
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{ ml: 'auto', color: '#001F52' }}
                    >
                        Actualizar
                    </Button>
                )}
            </Box>

            {liveStreams.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2.5, color: '#001F52', display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#EF4444', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                        Transmisiones en Vivo
                    </Typography>
                    <Grid container spacing={2}>
                        {liveStreams.map((stream) => (
                            <Grid key={stream.id} size={{ xs: 12, sm: 6, md: 3 }}>
                                <GlassCard
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        border: activeStreamId === stream.id ? '2px solid #EDB112' : '1px solid rgba(0,0,0,0.1)',
                                        bgcolor: activeStreamId === stream.id ? 'rgba(237, 177, 18, 0.05)' : '#fff',
                                        '&:hover': { transform: 'translateY(-1px)', borderColor: '#001F52' }
                                    }}
                                    onClick={() => setActiveStreamId(stream.id)}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                                            <PlayArrow sx={{ fontSize: 20 }} />
                                        </Avatar>
                                        <Box sx={{ overflow: 'hidden' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                                {stream.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {stream.matchup.team1} vs {stream.matchup.team2}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, lg: 9 }}>
                    <Box sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', bgcolor: '#000', position: 'relative' }}>
                        {featuredStream ? (
                            <>
                                <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
                                    {currentEmbedUrl ? (
                                        <iframe
                                            key={featuredStream.id}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                border: 0
                                            }}
                                            src={currentEmbedUrl}
                                            title={featuredStream.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#111', color: 'white' }}>
                                            <VideoIcon sx={{ fontSize: 80, mb: 2, opacity: 0.5 }} />
                                            <Typography variant="h6" sx={{ opacity: 0.8 }}>Transmisión Externa</Typography>
                                            <Button component="a" href={featuredStream.streamUrl} target="_blank" rel="noopener noreferrer" variant="contained" color="error" sx={{ mt: 2, px: 3, borderRadius: 2 }}>
                                                Ver en Sitio <EyeIcon sx={{ ml: 1 }} />
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ p: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%)', position: 'absolute', bottom: 0, left: 0, right: 0, color: 'white' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                                {featuredStream.status === 'live' ? (
                                                    <Chip label="EN VIVO" color="error" size="small" sx={{ fontWeight: 900, borderRadius: 1 }} />
                                                ) : (
                                                    <Chip label="PRÓXIMAMENTE" color="primary" size="small" sx={{ fontWeight: 900, borderRadius: 1 }} />
                                                )}
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 800 }}>{featuredStream.title}</Typography>
                                            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                {featuredStream.matchup.team1} vs {featuredStream.matchup.team2}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <IconButton onClick={handleLike} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { transform: 'scale(1.1)' } }}>
                                                    <ThumbUp />
                                                </IconButton>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{featuredStream.likes || 0}</Typography>
                                            </Box>
                                            <IconButton onClick={() => handleShare(featuredStream)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                                                <Share />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#111', color: 'white' }}>
                                <Typography>Selecciona una transmisión</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                    <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', maxHeight: 600, bgcolor: 'white' }}>
                        <Box sx={{
                            p: 2,
                            background: '#001F52',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Typography variant="subtitle1" fontWeight="bold">Chat en Vivo</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        bgcolor: '#22C55E',
                                        borderRadius: '50%',
                                    }}
                                />
                                <Typography variant="caption" fontWeight="bold">
                                    {onlineUsers} Online
                                </Typography>
                            </Box>
                        </Box>
                        {user?.rol === 'ADMIN' && (
                            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<ClearChatIcon />}
                                    onClick={handleClearChat}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                    Limpiar Chat
                                </Button>
                            </Box>
                        )}
                        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                            {chatMessages.map((msg) => (
                                <ListItem key={msg.id} alignItems="flex-start" sx={{ px: 1, py: 0.5 }}>
                                    <ListItemAvatar sx={{ minWidth: 40, cursor: user?.rol === 'ADMIN' ? 'pointer' : 'default' }} onClick={(e) => handleUserClick(e, msg.userId, msg.user)}>
                                        <Avatar sx={{
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.8rem',
                                            bgcolor: msg.isAdmin ? '#EDB112' : (msg.isSystem ? '#EF4444' : '#001F52'),
                                            color: msg.isAdmin ? '#001F52' : 'white',
                                            boxShadow: '0 2px 8px rgba(0,31,82,0.1)',
                                            fontWeight: 800
                                        }}>
                                            {msg.isAdmin ? <AdminPanelSettings sx={{ fontSize: 16 }} /> : (msg.isSystem ? 'S' : msg.user.charAt(0))}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight="800"
                                                    sx={{
                                                        color: msg.isAdmin ? '#EDB112' : (msg.isSystem ? '#EF4444' : '#001F52'),
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {msg.user}
                                                </Typography>
                                                {msg.isAdmin && (
                                                    <Chip
                                                        label="ADMIN"
                                                        size="small"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: '0.6rem',
                                                            bgcolor: '#EDB112',
                                                            color: '#001F52',
                                                            fontWeight: '900',
                                                            borderRadius: 1,
                                                            '& .MuiChip-label': { px: 0.5 }
                                                        }}
                                                    />
                                                )}
                                                <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto', fontSize: '0.65rem' }}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    wordBreak: 'break-word',
                                                    mt: 0.2,
                                                    color: '#334155',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {msg.message}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            ))}
                            <div ref={chatEndRef} />
                        </List>

                        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #eee' }}>
                            {isBanned ? (
                                <Alert severity="error" icon={<Block fontSize="inherit" />}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Chat bloqueado</Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>Motivo: {banReason}</Typography>
                                        {banUntil && (
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                                                Expira en aproximadamente: {Math.max(0, Math.ceil((banUntil.getTime() - new Date().getTime()) / 60000))} min
                                            </Typography>
                                        )}
                                    </Box>
                                </Alert>
                            ) : (
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Mensaje..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton type="submit" size="small" disabled={!newMessage.trim()}><SendIcon /></IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            )}
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Next Events */}
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: '#001F52', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarIcon sx={{ color: '#EDB112' }} /> Próximos Eventos
            </Typography>
            <Grid container spacing={3}>
                {upcomingStreams.map((stream) => (
                    <Grid key={stream.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <GlassCard sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">{stream.title}</Typography>
                            <Typography variant="body2" color="textSecondary">{stream.matchup.team1} vs {stream.matchup.team2}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{new Date(stream.scheduledDate).toLocaleString()}</Typography>
                            <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => setActiveStreamId(stream.id)}>Ver Detalles</Button>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            {/* Ban Dialog */}
            <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
                <DialogTitle>Banear Usuario</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="Motivo" fullWidth value={banReasonInput} onChange={e => setBanReasonInput(e.target.value)} />
                        <TextField label="Minutos" type="number" fullWidth value={banDuration} onChange={e => setBanDuration(Number(e.target.value))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBanDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleBanUser} color="error" variant="contained">Confirmar</Button>
                </DialogActions>
            </Dialog>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setBanDialogOpen(true); setAnchorEl(null); }}><Block sx={{ mr: 1 }} /> Banear</MenuItem>
            </Menu>
        </Box>
    );
}
