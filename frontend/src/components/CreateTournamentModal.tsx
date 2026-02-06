import { useEffect, useState } from 'react';
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
    Checkbox,
    FormControlLabel,
    Box,
    Typography,
    Avatar,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Team, Tournament } from '../types';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: Team[];
    tournamentToEdit?: Tournament | null;
    onCreateTournament: (tournament: {
        id?: string;
        name: string;
        sport: string;
        format: 'groups' | 'knockout' | 'single-elimination';
        teams: string[];
        image?: string;
    }) => void;
}

export function CreateTournamentModal({ isOpen, onClose, teams, onCreateTournament, tournamentToEdit }: CreateTournamentModalProps) {
    const [name, setName] = useState('');
    const [sport, setSport] = useState('');
    const [format, setFormat] = useState<'groups' | 'knockout' | 'single-elimination'>('knockout');
    const [image, setImage] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    useEffect(() => {
        if (tournamentToEdit) {
            setName(tournamentToEdit.name);
            setSport(tournamentToEdit.sport);
            setFormat(tournamentToEdit.format);
            setImage(tournamentToEdit.image || '');
            setSelectedTeams(tournamentToEdit.teams);
        } else {
            setName('');
            setSport('');
            setFormat('knockout');
            setImage('');
            setSelectedTeams([]);
        }
    }, [tournamentToEdit, isOpen]);

    const handleToggleTeam = (teamId: string) => {
        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(selectedTeams.filter(t => t !== teamId));
        } else {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && sport && selectedTeams.length >= 2) {
            onCreateTournament({
                id: tournamentToEdit?.id,
                name,
                sport,
                format,
                teams: selectedTeams,
                image,
            });
            onClose();
        }
    };

    const availableTeams = teams.filter(t => t.sport === sport || !sport);

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    {tournamentToEdit ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Nombre del Torneo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Campeonato UIDE 2026"
                            required
                            fullWidth
                        />

                        <TextField
                            label="URL de la Imagen (Opcional)"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            fullWidth
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Deporte</InputLabel>
                            <Select
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                                label="Deporte"
                            >
                                <MenuItem value="Fútbol">Fútbol</MenuItem>
                                <MenuItem value="Baloncesto">Baloncesto</MenuItem>
                                <MenuItem value="Voleibol">Voleibol</MenuItem>
                                <MenuItem value="Tenis">Tenis</MenuItem>
                                <MenuItem value="Otros">Otros</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Formato del Torneo</InputLabel>
                            <Select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as any)}
                                label="Formato del Torneo"
                            >
                                <MenuItem value="knockout">Eliminación Directa</MenuItem>
                                <MenuItem value="groups">Fase de Grupos</MenuItem>
                                <MenuItem value="single-elimination">Eliminación Simple</MenuItem>
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Seleccionar Equipos (mínimo 2)
                            </Typography>
                            {availableTeams.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No hay equipos disponibles. Crea equipos primero.
                                </Typography>
                            ) : (
                                <Box
                                    sx={{
                                        maxHeight: 300,
                                        overflowY: 'auto',
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        p: 2,
                                    }}
                                >
                                    {availableTeams.map((team) => (
                                        <FormControlLabel
                                            key={team.id}
                                            control={
                                                <Checkbox
                                                    checked={selectedTeams.includes(team.id)}
                                                    onChange={() => handleToggleTeam(team.id)}
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: team.color,
                                                            width: 32,
                                                            height: 32,
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {team.name.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body1">{team.name}</Typography>
                                                </Box>
                                            }
                                            sx={{ width: '100%', mb: 1, ml: 0 }}
                                        />
                                    ))}
                                </Box>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {selectedTeams.length} equipo(s) seleccionado(s)
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} variant="outlined" size="large">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={selectedTeams.length < 2}
                    >
                        {tournamentToEdit ? 'Guardar Cambios' : 'Crear Torneo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
