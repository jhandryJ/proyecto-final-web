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
    CircularProgress,
    Autocomplete
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { authService } from '../services/auth.service';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (team: any) => void;
}

export function CreateTeamModal({ isOpen, onClose, onCreateTeam }: CreateTeamModalProps) {
    const [name, setName] = useState('');
    const [sport, setSport] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
    const [selectedCaptain, setSelectedCaptain] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            const user = authService.getCurrentUser();
            setCurrentUser(user);
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await authService.getAllUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && sport) {
            const payload: any = {
                nombre: name,
                facultad: sport, // Mapping 'sport' to 'facultad' temporarily or need backend field? Backend uses facultad/logoUrl. 
                // Wait, backend schema has 'facultad' but we treat it as sport in frontend mapping? 
                // Let's keep consistency with previous dashboard View: 
                // Dashboard maps: name->nombre, sport->facultad (fallback).
                // So we send sport as facultad.
                logoUrl: color,
                miembros: selectedMembers.map((m: any) => ({
                    usuarioId: m.usuarioId,
                    dorsal: m.dorsal || undefined, // Zod optional() expects undefined, not null
                    posicion: m.posicion || undefined
                }))
            };

            // Only Admin allows choosing captain. Logic block:
            if (currentUser?.rol === 'ADMIN' && selectedCaptain) {
                payload.capitanId = selectedCaptain;
            } else {
                // If not admin, or no captain selected, backend defaults to creating user.
                // But if we want to include the creator in members list? Backend adds creator automatically.
            }

            onCreateTeam(payload);

            // Reset
            setName('');
            setSport('');
            setColor('#3B82F6');
            setSelectedMembers([]);
            setSelectedCaptain('');
            onClose();
        }
    };



    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    Crear Nuevo Equipo
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Nombre del Equipo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Deporte / Facultad</InputLabel>
                            <Select
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                                label="Deporte / Facultad"
                            >
                                <MenuItem value="Fútbol">Fútbol</MenuItem>
                                <MenuItem value="Baloncesto">Baloncesto</MenuItem>
                                <MenuItem value="Voleibol">Voleibol</MenuItem>
                                <MenuItem value="Ingeniería">Ingeniería</MenuItem>
                                <MenuItem value="Medicina">Medicina</MenuItem>
                                <MenuItem value="Derecho">Derecho</MenuItem>
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Color del Equipo</Typography>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ height: 40, width: 80, cursor: 'pointer' }}
                            />
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                <Autocomplete
                                    fullWidth
                                    options={users}
                                    getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                                    value={null}
                                    onChange={(_, newValue) => {
                                        if (newValue && !selectedMembers.some((m: any) => m.usuarioId === newValue.id)) {
                                            setSelectedMembers([...selectedMembers, {
                                                usuarioId: newValue.id,
                                                user: newValue, // Keep user reference for display
                                                dorsal: '',
                                                posicion: ''
                                            }]);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Buscar usuario para agregar" placeholder="Escriba nombre..." />
                                    )}
                                />
                            </Box>

                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Nómina del Equipo:</Typography>
                            {selectedMembers.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No hay miembros agregados.</Typography>
                            ) : (
                                selectedMembers.map((member: any, index: number) => (
                                    <Box key={member.usuarioId} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                        <Typography sx={{ flex: 2, fontSize: '0.9rem' }}>
                                            {member.user.nombres} {member.user.apellidos}
                                        </Typography>
                                        <TextField
                                            label="Dorsal"
                                            size="small"
                                            sx={{ flex: 1 }}
                                            value={member.dorsal}
                                            onChange={(e) => {
                                                const newMembers = [...selectedMembers];
                                                newMembers[index].dorsal = e.target.value;
                                                setSelectedMembers(newMembers);
                                            }}
                                        />
                                        <Select
                                            size="small"
                                            sx={{ flex: 2 }}
                                            value={member.posicion}
                                            displayEmpty
                                            onChange={(e) => {
                                                const newMembers = [...selectedMembers];
                                                newMembers[index].posicion = e.target.value;
                                                setSelectedMembers(newMembers);
                                            }}
                                        >
                                            <MenuItem value="" disabled><em>Posición</em></MenuItem>
                                            <MenuItem value="Portero">Portero</MenuItem>
                                            <MenuItem value="Defensa">Defensa</MenuItem>
                                            <MenuItem value="Mediocampista">Mediocampista</MenuItem>
                                            <MenuItem value="Delantero">Delantero</MenuItem>
                                            <MenuItem value="Pivote">Pivote</MenuItem>
                                            <MenuItem value="Alero">Alero</MenuItem>
                                        </Select>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                                const newMembers = selectedMembers.filter((_: any, i: number) => i !== index);
                                                setSelectedMembers(newMembers);
                                                // Reset captain if removed
                                                if (selectedCaptain === member.usuarioId) setSelectedCaptain('');
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                ))
                            )}
                        </Box>

                        {currentUser?.rol === 'ADMIN' && (
                            <FormControl fullWidth>
                                <InputLabel>Capitán</InputLabel>
                                <Select
                                    value={selectedCaptain}
                                    onChange={(e) => setSelectedCaptain(Number(e.target.value))}
                                    label="Capitán"
                                >
                                    <MenuItem value=""><em>Seleccionar de la lista...</em></MenuItem>
                                    {selectedMembers.map((m: any) => (
                                        <MenuItem key={m.usuarioId} value={m.usuarioId}>
                                            {m.user.nombres} {m.user.apellidos}
                                        </MenuItem>
                                    ))}
                                    {/* Fallback to currentUser if not in list logic, but requirement was 'choose from added' */}
                                    <MenuItem value={currentUser?.id}>Min (Admin/Creador)</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} variant="outlined">Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading || selectedMembers.length === 0}>
                        {loading ? <CircularProgress size={24} /> : 'Crear Equipo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
