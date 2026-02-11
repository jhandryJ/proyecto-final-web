import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import { Close as CloseIcon, PersonAdd as PersonAddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Genero, Disciplina } from '../types';
import type { Team, Player, Carrera } from '../types';
import { useAuth } from '../context/AuthContext';
import { usersService, type Usuario } from '../services/users.service';
import { resourcesService } from '../services/resources.service';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
    teamToEdit?: Team | null;
}

export function CreateTeamModal({ isOpen, onClose, onCreateTeam, teamToEdit }: CreateTeamModalProps) {
    const { isAdmin } = useAuth();
    const [name, setName] = useState('');
    const [facultad, setFacultad] = useState('');
    const [disciplina, setDisciplina] = useState('');
    const [genero, setGenero] = useState<string>('MIXTO');
    const [logoUrl, setLogoUrl] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [captainId, setCaptainId] = useState<number | ''>('');
    const [users, setUsers] = useState<Usuario[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [players, setPlayers] = useState<Omit<Player, 'id'>[]>([]);
    const [playerName, setPlayerName] = useState('');
    const [playerNumber, setPlayerNumber] = useState('');
    const [playerPosition, setPlayerPosition] = useState('');

    useEffect(() => {
        const fetchCarreras = async () => {
            try {
                const data = await resourcesService.getCareers();
                setCarreras(data);
            } catch (error) {
                console.error('Error al obtener carreras:', error);
            }
        };
        fetchCarreras();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (teamToEdit) {
                setName(teamToEdit.nombre || '');
                setFacultad(teamToEdit.facultad || '');
                setDisciplina(teamToEdit.disciplina as string || '');
                setGenero((teamToEdit.genero as string) || 'MIXTO');
                setLogoUrl(teamToEdit.logoUrl || '');
                setAccessCode(teamToEdit.codigoAcceso || '');
                setCaptainId(teamToEdit.capitanId || '');
                // Handle players if available in teamToEdit (might need mapping)
                // Assuming teamToEdit might have players or members
                // For now, we leave players empty or try to map if structure matches
                setPlayers(teamToEdit.players || []);
            } else {
                // Reset for create mode
                setName('');
                setFacultad('');
                setDisciplina('');
                setGenero('MIXTO');
                setLogoUrl('');
                setAccessCode('');
                setCaptainId('');
                setPlayers([]);
            }
        }
    }, [isOpen, teamToEdit]);

    // Load users when modal opens (only for admins)
    useEffect(() => {
        if (isOpen && isAdmin) {
            loadUsers();
        }
    }, [isOpen, isAdmin]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const usersData = await usersService.getAll();
            setUsers(usersData);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddPlayer = () => {
        if (playerName && playerNumber && playerPosition) {
            setPlayers([
                ...players,
                {
                    name: playerName,
                    number: parseInt(playerNumber),
                    position: playerPosition,
                },
            ]);
            setPlayerName('');
            setPlayerNumber('');
            setPlayerPosition('');
        }
    };

    const handleRemovePlayer = (index: number) => {
        setPlayers(players.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onCreateTeam({
                nombre: name,
                facultad,
                disciplina,
                genero,
                logoUrl: logoUrl || undefined,
                codigoAcceso: accessCode || undefined,
                capitanId: captainId ? Number(captainId) : undefined,
                players: players as any
            } as any);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    {teamToEdit ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                                <TextField
                                    label="Nombre del Equipo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Leones UIDE"
                                    required
                                    fullWidth
                                />
                            </Box>
                            <Box>
                                <FormControl fullWidth required>
                                    <InputLabel>Disciplina</InputLabel>
                                    <Select
                                        value={disciplina}
                                        onChange={(e) => setDisciplina(e.target.value)}
                                        label="Disciplina"
                                    >
                                        <MenuItem value="FUTBOL">Fútbol</MenuItem>
                                        <MenuItem value="BASKET">Baloncesto</MenuItem>
                                        <MenuItem value="ECUAVOLEY">Ecuavóley</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box>
                            <FormControl fullWidth required>
                                <InputLabel>Carrera</InputLabel>
                                <Select
                                    value={facultad}
                                    onChange={(e) => setFacultad(e.target.value)}
                                    label="Carrera"
                                >
                                    {carreras.map((carrera) => (
                                        <MenuItem key={carrera.id} value={carrera.nombre}>
                                            {carrera.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <FormControl fullWidth required>
                                <InputLabel>Género</InputLabel>
                                <Select
                                    value={genero}
                                    onChange={(e) => setGenero(e.target.value)}
                                    label="Género"
                                >
                                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                                    <MenuItem value="FEMENINO">Femenino</MenuItem>
                                    <MenuItem value="MIXTO">Mixto</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <TextField
                                label="URL del Logo (Opcional)"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://ejemplo.com/logo.png"
                                fullWidth
                                helperText="Ingresa la URL de la imagen del logo del equipo"
                            />
                        </Box>

                        <Box>
                            <TextField
                                label="Código de Acceso (Opcional)"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="Ej: UIDE2024"
                                fullWidth
                                helperText="Comparte este código con quienes quieran unirse a tu equipo."
                            />
                        </Box>

                        {isAdmin && (
                            <Box>
                                <FormControl fullWidth>
                                    <InputLabel>Capitán (Opcional)</InputLabel>
                                    <Select
                                        value={captainId}
                                        onChange={(e) => setCaptainId(e.target.value as number)}
                                        label="Capitán (Opcional)"
                                        disabled={loadingUsers}
                                    >
                                        <MenuItem value="">
                                            <em>Yo seré el capitán</em>
                                        </MenuItem>
                                        {users.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                {user.nombres} {user.apellidos} ({user.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Jugadores (Opcional)
                            </Typography>
                            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 5' } }}>
                                        <TextField
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            placeholder="Nombre"
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 2' } }}>
                                        <TextField
                                            type="number"
                                            value={playerNumber}
                                            onChange={(e) => setPlayerNumber(e.target.value)}
                                            placeholder="#"
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
                                        <TextField
                                            value={playerPosition}
                                            onChange={(e) => setPlayerPosition(e.target.value)}
                                            placeholder="Posición"
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 2' } }}>
                                        <Button
                                            onClick={handleAddPlayer}
                                            variant="contained"
                                            size="small"
                                            fullWidth
                                            sx={{ height: '40px' }}
                                            startIcon={<PersonAddIcon />}
                                        />
                                    </Box>
                                </Box>

                                {players.length > 0 && (
                                    <List sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                                        {players.map((player, index) => (
                                            <ListItem key={index}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                                                        {player.number}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={player.name}
                                                    secondary={player.position}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleRemovePlayer(index)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} variant="outlined" size="large">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" size="large">
                        {teamToEdit ? 'Guardar Cambios' : 'Crear Equipo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
