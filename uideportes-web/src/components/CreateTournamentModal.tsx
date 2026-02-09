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
    // Campos del Campeonato
    const [championshipName, setChampionshipName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Campos del Torneo
    const [disciplina, setDisciplina] = useState('');
    const [categoria, setCategoria] = useState('');
    const [genero, setGenero] = useState('');
    const [image, setImage] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [costoInscripcion, setCostoInscripcion] = useState(0);

    useEffect(() => {
        if (tournamentToEdit) {
            // Cargar datos del torneo para editar
            setChampionshipName(tournamentToEdit.name ?? '');
            setDisciplina(tournamentToEdit.sport || '');
            setCategoria(tournamentToEdit.format === 'groups' ? 'FASE_GRUPOS' : 'ELIMINATORIA');
            setImage(tournamentToEdit.image || '');
            setGenero(tournamentToEdit.genero || '');
            setCostoInscripcion(tournamentToEdit.costoInscripcion || 0);

            // Map team names back to IDs for editing
            const teamIds = teams
                .filter(t => (tournamentToEdit.teams || []).includes(t.name || t.nombre))
                .map(t => t.id);
            setSelectedTeams(teamIds || []);
        } else {
            // Reset form
            setChampionshipName('');
            setYear(new Date().getFullYear());
            setStartDate('');
            setEndDate('');
            setDisciplina('');
            setCategoria('');
            setGenero('');
            setImage('');
            setCostoInscripcion(0);
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
        if (championshipName && disciplina && categoria && genero) {
            // Mapear categoría a formato legacy
            const formatMap: Record<string, 'groups' | 'knockout' | 'single-elimination'> = {
                'FASE_GRUPOS': 'groups',
                'ELIMINATORIA': 'knockout',
                'TODOS_CONTRA_TODOS': 'single-elimination',
            };

            onCreateTournament({
                id: tournamentToEdit?.id,
                name: championshipName,
                sport: disciplina,
                format: formatMap[categoria] || 'knockout',
                teams: selectedTeams,
                image,
                // Campos adicionales para el backend
                championshipName,
                year,
                startDate,
                endDate,
                disciplina,
                categoria,
                genero,
                costoInscripcion,
            } as any);
            onClose();
        }
    };

    const availableTeams = teams.filter(t =>
        (t.disciplina === disciplina || t.sport === disciplina) || !disciplina
    );

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
                        {/* Sección de Campeonato */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                                Información del Campeonato
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                                <TextField
                                    label="Nombre del Campeonato"
                                    value={championshipName}
                                    onChange={(e) => setChampionshipName(e.target.value)}
                                    placeholder="Ej: Campeonato UIDE 2026"
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Año"
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    required
                                    fullWidth
                                    inputProps={{ min: 2025 }}
                                />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                                <TextField
                                    label="Fecha de Inicio"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Fecha de Fin (Opcional)"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </Box>

                        {/* Sección de Torneo */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                                Información del Torneo
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
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

                                <FormControl fullWidth required>
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                        label="Categoría"
                                    >
                                        <MenuItem value="ELIMINATORIA">Eliminatoria</MenuItem>
                                        <MenuItem value="FASE_GRUPOS">Fase de Grupos</MenuItem>
                                        <MenuItem value="TODOS_CONTRA_TODOS">Todos contra Todos</MenuItem>
                                    </Select>
                                </FormControl>

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

                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    label="Costo de Inscripción ($)"
                                    type="number"
                                    value={costoInscripcion}
                                    onChange={(e) => setCostoInscripcion(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    helperText="Ingrese 0 si la inscripción es gratuita"
                                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                                />
                            </Box>
                        </Box>

                        <TextField
                            label="URL de la Imagen (Opcional)"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            fullWidth
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Seleccionar Equipos (Opcional)
                            </Typography>
                            {availableTeams.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No hay equipos disponibles.
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
                                                        {(team.name || team.nombre || 'T').charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body1">{team.name || team.nombre || 'Sin nombre'}</Typography>
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
                    >
                        {tournamentToEdit ? 'Guardar Cambios' : 'Crear Torneo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
