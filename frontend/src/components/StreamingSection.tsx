import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    MenuItem,
    Card,
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
    Tab
} from '@mui/material';
import {
    Videocam as VideoIcon,
    CalendarMonth as CalendarIcon,
    Visibility as EyeIcon,
    Send as SendIcon,
    ThumbUp,
    Share,
    Info,
    Edit,
    Delete,
    PlayArrow
} from '@mui/icons-material';
import type { StreamEvent, Matchup, Team } from '../types';

interface StreamingSectionProps {
    streams: StreamEvent[];
    matchups: Matchup[];
    teams: Team[];
    onCreateStream: (stream: StreamEvent | Omit<StreamEvent, 'id'>) => void;
    onDeleteStream: (streamId: string) => void;
}

interface ChatMessage {
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
}

export function StreamingSection({ streams, matchups, teams, onCreateStream, onDeleteStream }: StreamingSectionProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
    const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
    const [selectedSport, setSelectedSport] = useState('Todos');
    const [title, setTitle] = useState('');
    const [selectedMatchupId, setSelectedMatchupId] = useState('');
    const [streamUrl, setStreamUrl] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '1', user: 'System', avatar: '', message: '¡Bienvenidos a la transmisión oficial!', timestamp: new Date(), isSystem: true },
        { id: '2', user: 'Juan Pérez', avatar: 'J', message: '¡Vamos Civil! Este año es nuestro 👷‍♂️', timestamp: new Date() },
        { id: '3', user: 'Maria G.', avatar: 'M', message: 'Medicina presente 💉', timestamp: new Date() },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current?.parentElement) {
            chatEndRef.current.parentElement.scrollTop = chatEndRef.current.parentElement.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        // If the currently featured stream is deleted, clear the selection so it falls back safely
        if (activeStreamId && !streams.find(s => s.id === activeStreamId)) {
            setActiveStreamId(null);
        }
    }, [streams, activeStreamId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const matchup = matchups.find(m => m.id === selectedMatchupId);
        if (matchup) {
            onCreateStream({
                id: editingStreamId || undefined,
                title,
                matchup,
                streamUrl,
                scheduledDate: new Date(scheduledDate),
                status: editingStreamId ? (streams.find(s => s.id === editingStreamId)?.status || 'upcoming') : 'upcoming',
                viewers: editingStreamId ? (streams.find(s => s.id === editingStreamId)?.viewers || 0) : 0,
            } as StreamEvent);
            // Reset
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
        setSelectedMatchupId(stream.matchup.id);
        setStreamUrl(stream.streamUrl);
        // Format date for datetime-local input (YYYY-MM-DDThh:mm)
        const date = new Date(stream.scheduledDate);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setScheduledDate(date.toISOString().slice(0, 16));

        setEditingStreamId(stream.id);
        setShowCreateForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            user: 'Tú',
            avatar: 'T',
            message: newMessage,
            timestamp: new Date()
        };

        setChatMessages([...chatMessages, newMsg]);
        setNewMessage('');
    };


    const sports = ['Todos', ...Array.from(new Set(teams.map(t => t.sport)))];

    const filteredStreams = streams.filter(stream => {
        if (selectedSport === 'Todos') return true;
        const team1 = teams.find(t => t.name === stream.matchup.team1);
        return team1?.sport === selectedSport;
    });

    const upcomingStreams = filteredStreams.filter(s => s.status === 'upcoming');
    const liveStreams = filteredStreams.filter(s => s.status === 'live');
    // For demo, if no live stream, let's treat the first upcoming as "featured" or show a placeholder
    // Prioritize active stream if it's in the current filter, then live, then first upcoming
    const featuredStream = (activeStreamId ? filteredStreams.find(s => s.id === activeStreamId) : null) || liveStreams[0] || upcomingStreams[0];

    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        // YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
        }

        // Twitch
        const twitchRegex = /twitch\.tv\/([a-zA-Z0-9_]+)/;
        const twitchMatch = url.match(twitchRegex);
        if (twitchMatch && twitchMatch[1]) {
            return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
        }

        // Return null if no match found for supported providers
        return null;
    };

    const currentEmbedUrl = featuredStream ? getEmbedUrl(featuredStream.streamUrl) : null;

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header with Create Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    UIDE Sports Live
                </Typography>
                <Button
                    variant="contained"
                    sx={{ bgcolor: '#ff0000', color: 'white' }}
                    startIcon={<VideoIcon />}
                    onClick={() => {
                        resetForm();
                        setShowCreateForm(!showCreateForm);
                    }}
                >
                    {showCreateForm ? 'Cerrar Formulario' : 'Nueva Transmisión'}
                </Button>
            </Box>

            {/* Sport Category Tabs */}
            <Paper sx={{ mb: 4, bgcolor: '#1a1a1a', borderRadius: 2 }}>
                <Tabs
                    value={selectedSport}
                    onChange={(_, newValue) => setSelectedSport(newValue)}
                    textColor="inherit"
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': { color: '#aaa', '&.Mui-selected': { color: 'white' } },
                        '& .MuiTabs-indicator': { bgcolor: '#ff0000' }
                    }}
                >
                    {sports.map(sport => (
                        <Tab key={sport} label={sport} value={sport} />
                    ))}
                </Tabs>
            </Paper>

            {showCreateForm && (
                <Paper sx={{ p: 4, mb: 4, borderRadius: 4 }} component="form" onSubmit={handleSubmit} elevation={3}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {editingStreamId ? 'Editar Evento' : 'Programar Evento'}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                        <TextField fullWidth label="Título del Evento" value={title} onChange={e => setTitle(e.target.value)} required />
                        <TextField select fullWidth label="Partido" value={selectedMatchupId} onChange={e => setSelectedMatchupId(e.target.value)} required>
                            {matchups.map(m => <MenuItem key={m.id} value={m.id}>{m.team1} vs {m.team2}</MenuItem>)}
                        </TextField>
                        <TextField fullWidth label="URL del Stream" value={streamUrl} onChange={e => setStreamUrl(e.target.value)} placeholder="YouTube / Twitch" required />
                        <TextField fullWidth type="datetime-local" label="Fecha" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={resetForm}>Cancelar</Button>
                        <Button type="submit" variant="contained" sx={{ bgcolor: '#ff0000' }}>
                            {editingStreamId ? 'Guardar Cambios' : 'Crear'}
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
                bgcolor: '#0f0f0f',
                p: 3,
                borderRadius: 4,
                color: 'white'
            }}>
                {/* Main Player Area */}
                <Box>
                    {featuredStream ? (
                        <>
                            <Box
                                key={featuredStream.id}
                                sx={{
                                    position: 'relative',
                                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                                    bgcolor: 'black',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    mb: 2,
                                    boxShadow: '0 0 20px rgba(255, 0, 0, 0.2)'
                                }}>
                                {currentEmbedUrl ? (
                                    <iframe
                                        key={featuredStream.id}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                        src={currentEmbedUrl}
                                        title={featuredStream.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: '#222',
                                            textAlign: 'center',
                                            color: 'white',
                                            p: 3
                                        }}
                                    >
                                        <VideoIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Esta transmisión se aloja en un sitio externo
                                        </Typography>
                                        <Typography variant="body2" color="gray" sx={{ mb: 3 }}>
                                            El sitio no permite ser visualizado aquí. Haz clic abajo para verlo.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            href={featuredStream.streamUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            startIcon={<EyeIcon />}
                                        >
                                            Ver Transmisión
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {featuredStream.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#aaa', mb: 2 }}>
                                        {featuredStream.matchup.team1} vs {featuredStream.matchup.team2}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {featuredStream.status === 'live' ? (
                                            <Chip label="EN VIVO" color="error" size="small" />
                                        ) : (
                                            <Chip label="PRÓXIMAMENTE" color="primary" size="small" />
                                        )}
                                        <Chip icon={<EyeIcon sx={{ color: 'white !important' }} />} label="1.2k espectadores" variant="outlined" sx={{ color: 'white', borderColor: '#333' }} />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                        onClick={() => onDeleteStream(featuredStream.id)}
                                        sx={{ color: 'white', bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                                        title="Eliminar Transmisión"
                                    >
                                        <Delete />
                                    </IconButton>
                                    <IconButton sx={{ color: 'white', bgcolor: '#333', '&:hover': { bgcolor: '#444' } }}><ThumbUp /></IconButton>
                                    <IconButton sx={{ color: 'white', bgcolor: '#333', '&:hover': { bgcolor: '#444' } }}><Share /></IconButton>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a', borderRadius: 2 }}>
                            <VideoIcon sx={{ fontSize: 60, color: '#333', mb: 2 }} />
                            <Typography color="gray">No hay transmisión seleccionada</Typography>
                        </Box>
                    )}
                </Box>

                {/* Live Chat Panel */}
                <Paper sx={{
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    height: { xs: 400, lg: 'auto' },
                    maxHeight: 600,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Chat en Vivo</Typography>
                        <Info sx={{ color: '#666', fontSize: 20 }} />
                    </Box>

                    <List sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                        {chatMessages.map((msg) => (
                            <ListItem key={msg.id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                                <ListItemAvatar sx={{ minWidth: 40 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: msg.isSystem ? '#ff0000' : '#333', fontSize: '0.8rem' }}>
                                        {msg.avatar || 'S'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: msg.isSystem ? '#ff0000' : '#aaa', fontWeight: 'bold' }}>
                                                {msg.user}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#555' }}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="body2" sx={{ color: msg.isSystem ? '#fff' : '#ddd' }}>
                                            {msg.message}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                        <div ref={chatEndRef} />
                    </List>

                    <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #333' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Di algo..."
                            size="small"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            sx={{
                                bgcolor: '#2a2a2a',
                                borderRadius: 1,
                                input: { color: 'white' },
                                fieldset: { border: 'none' }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" type="submit" sx={{ color: '#aaa' }}>
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                            {/* Quick Reactions */}
                            <IconButton size="small" type="button" onClick={() => setNewMessage('🔥')} sx={{ p: 0.5 }}>🔥</IconButton>
                            <IconButton size="small" type="button" onClick={() => setNewMessage('⚽')} sx={{ p: 0.5 }}>⚽</IconButton>
                            <IconButton size="small" type="button" onClick={() => setNewMessage('👏')} sx={{ p: 0.5 }}>👏</IconButton>
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
                    <Card key={stream.id} sx={{ borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, transition: 'all 0.3s' } }}>
                        <Box sx={{ height: 140, bgcolor: '#eee', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Placeholder thumbnail */}
                            <VideoIcon sx={{ fontSize: 40, color: '#ccc' }} />
                            <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                                PROGRAMADO
                            </Box>
                        </Box>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold" noWrap title={stream.title}>
                                        {stream.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                                        sx={{ color: activeStreamId === stream.id ? 'success.main' : 'action.active', mr: 1 }}
                                        title="Ver Transmisión"
                                    >
                                        <PlayArrow fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleEditClick(stream)} sx={{ color: 'primary.main' }}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => onDeleteStream(stream.id)} sx={{ color: 'error.main' }}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#666', fontSize: '0.875rem' }}>
                                <CalendarIcon sx={{ fontSize: 16 }} />
                                {new Date(stream.scheduledDate).toLocaleDateString()} • {new Date(stream.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                {/* Add a "More" placeholder card */}
                <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent', border: '2px dashed #ccc', boxShadow: 'none' }}>
                    <Typography color="text.secondary">Más eventos pronto...</Typography>
                </Card>
            </Box>

        </Box >
    );
}
