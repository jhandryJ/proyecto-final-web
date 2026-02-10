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
    IconButton,
    Paper
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, AddCircle as AddIcon } from '@mui/icons-material';
import type { Team, Tournament } from '../types';

interface TournamentRow {
    disciplina: string;
    categoria: string;
    genero: string;
    costoInscripcion: number;
}

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: Team[];
    tournamentToEdit?: Tournament | null;
    onCreateTournament: (data: any) => void;
}

export function CreateTournamentModal({ isOpen, onClose, teams, onCreateTournament, tournamentToEdit }: CreateTournamentModalProps) {
    // Campos del Campeonato
    const [championshipName, setChampionshipName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Lista de Torneos (Disciplinas)
    const [torneos, setTorneos] = useState<TournamentRow[]>([]);

    // Edit Mode State (Legacy/Single)
    const [editDisciplina, setEditDisciplina] = useState('');
    const [editCategoria, setEditCategoria] = useState('');
    const [editGenero, setEditGenero] = useState('');
    const [editCosto, setEditCosto] = useState(0);
    const [editSelectedTeams, setEditSelectedTeams] = useState<string[]>([]);
    const [editImage, setEditImage] = useState('');


    useEffect(() => {
        if (tournamentToEdit) {
            // Cargar datos del torneo para editar
            const tourneyIdx = tournamentToEdit as any;
            setChampionshipName(tourneyIdx.championshipName || tournamentToEdit.name || (tournamentToEdit.campeonato?.nombre) || '');

            // Populate dates from championship if available
            if (tournamentToEdit.campeonato) {
                setYear(tournamentToEdit.campeonato.anio || new Date().getFullYear());
                setStartDate(tournamentToEdit.campeonato.fechaInicio ? new Date(tournamentToEdit.campeonato.fechaInicio).toISOString().split('T')[0] : '');
                setEndDate(tournamentToEdit.campeonato.fechaFin ? new Date(tournamentToEdit.campeonato.fechaFin).toISOString().split('T')[0] : '');
            } else {
                // Fallback if no championship data (shouldn't happen usually)
                setYear(new Date().getFullYear());
                setStartDate('');
                setEndDate('');
            }

            setEditDisciplina(tournamentToEdit.sport || tournamentToEdit.disciplina || '');
            setEditCategoria(tournamentToEdit.format === 'groups' ? 'FASE_GRUPOS' : (tournamentToEdit.categoria === 'FASE_GRUPOS' ? 'FASE_GRUPOS' : 'ELIMINATORIA'));
            setEditImage(tournamentToEdit.image || '');
            setEditGenero(tournamentToEdit.genero || '');
            setEditCosto(tournamentToEdit.costoInscripcion || 0);

            // Map team names and IDs back for editing
            // Current approach assumes teams prop has all teams.
            // tournamentToEdit might have teams as strings (names) or objects?
            // type definition says teams?: string[] or teamDetails?
            // Let's safe check both
            let initialSelected: string[] = [];

            if (tournamentToEdit.teamDetails && tournamentToEdit.teamDetails.length > 0) {
                initialSelected = tournamentToEdit.teamDetails.map(t => t.id.toString());
            } else if (tournamentToEdit.teams && tournamentToEdit.teams.length > 0) {
                // If we only have names, try to find IDs in the global teams list
                initialSelected = teams
                    .filter(t => (tournamentToEdit.teams || []).includes(t.name || t.nombre))
                    .map(t => t.id.toString());
            }

            setEditSelectedTeams(initialSelected);
        } else {
            // Reset form for new creation
            setChampionshipName('');
            setYear(new Date().getFullYear());
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate('');

            // Default 1 empty tournament row
            setTorneos([{
                disciplina: 'FUTBOL',
                categoria: 'ELIMINATORIA',
                genero: 'MASCULINO',
                costoInscripcion: 0
            }]);

            // Reset edit fields
            setEditDisciplina('');
            setEditCategoria('');
            setEditGenero('');
            setEditCosto(0);
            setEditSelectedTeams([]);
            setEditImage('');
        }
    }, [tournamentToEdit, isOpen, teams]);

    const handleAddTournamentRow = () => {
        setTorneos([...torneos, {
            disciplina: 'FUTBOL',
            categoria: 'ELIMINATORIA',
            genero: 'MASCULINO',
            costoInscripcion: 0
        }]);
    };

    const handleRemoveTournamentRow = (index: number) => {
        if (torneos.length > 1) {
            const newTorneos = [...torneos];
            newTorneos.splice(index, 1);
            setTorneos(newTorneos);
        }
    };

    const handleUpdateTournamentRow = (index: number, field: keyof TournamentRow, value: string | number) => {
        const newTorneos = [...torneos];
        newTorneos[index] = { ...newTorneos[index], [field]: value };
        setTorneos(newTorneos);
    };

    const handleToggleTeam = (teamId: string) => {
        if (editSelectedTeams.includes(teamId)) {
            setEditSelectedTeams(editSelectedTeams.filter(t => t !== teamId));
        } else {
            setEditSelectedTeams([...editSelectedTeams, teamId]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (tournamentToEdit) {
            // Edit Mode Submit
            // Mapear categoría a formato legacy (frontend prop)
            const formatMap: Record<string, 'groups' | 'knockout' | 'single-elimination'> = {
                'FASE_GRUPOS': 'groups',
                'ELIMINATORIA': 'knockout',
                'TODOS_CONTRA_TODOS': 'single-elimination',
            };

            onCreateTournament({
                id: tournamentToEdit.id,
                name: championshipName,
                sport: editDisciplina,
                format: formatMap[editCategoria] || 'knockout',
                teams: editSelectedTeams,
                image: editImage,
                // Extra metadata for backend
                championshipName,
                year: tournamentToEdit.createdAt ? new Date(tournamentToEdit.createdAt).getFullYear() : year,
                startDate,
                endDate,
                disciplina: editDisciplina,
                categoria: editCategoria,
                genero: editGenero,
                costoInscripcion: editCosto
            });
        } else {
            // Create Mode Submit (Bulk)
            const payload = {
                nombre: championshipName,
                anio: year,
                fechaInicio: startDate,
                fechaFin: endDate || undefined,
                torneos: torneos
            };
            onCreateTournament(payload);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold', color: '#001F52' }}>
                    {tournamentToEdit ? 'Editar Torneo' : 'Crear Nuevo Campeonato'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* 1. Información General del Campeonato */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, color: '#001F52', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                1. Información del Evento
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
                                        <TextField
                                            label="Nombre del Campeonato"
                                            value={championshipName}
                                            onChange={(e) => setChampionshipName(e.target.value)}
                                            placeholder="Ej: Olimpiadas UIDE 2026"
                                            required
                                            fullWidth
                                            variant="outlined"
                                        />
                                    </Box>
                                    <TextField
                                        label="Año"
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Inicio"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Fin (Opcional)"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                            </Paper>
                        </Box>

                        {/* 2. Disciplinas (Solo en creación) */}
                        {!tournamentToEdit && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: '#001F52', fontWeight: 600 }}>
                                    2. Disciplinas y Categorías
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Agregue todas las disciplinas que formarán parte de este campeonato. Se crearán llaves independientes para cada una.
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {torneos.map((torneo, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Typography sx={{ fontWeight: 'bold', color: '#94a3b8', minWidth: 20 }}>{index + 1}</Typography>

                                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                                <InputLabel>Disciplina</InputLabel>
                                                <Select
                                                    value={torneo.disciplina}
                                                    label="Disciplina"
                                                    onChange={(e) => handleUpdateTournamentRow(index, 'disciplina', e.target.value)}
                                                >
                                                    <MenuItem value="FUTBOL">Fútbol</MenuItem>
                                                    <MenuItem value="BASKET">Baloncesto</MenuItem>
                                                    <MenuItem value="ECUAVOLEY">Ecuavóley</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                                <InputLabel>Género</InputLabel>
                                                <Select
                                                    value={torneo.genero}
                                                    label="Género"
                                                    onChange={(e) => handleUpdateTournamentRow(index, 'genero', e.target.value)}
                                                >
                                                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                                                    <MenuItem value="FEMENINO">Femenino</MenuItem>
                                                    <MenuItem value="MIXTO">Mixto</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                                <InputLabel>Formato</InputLabel>
                                                <Select
                                                    value={torneo.categoria}
                                                    label="Formato"
                                                    onChange={(e) => handleUpdateTournamentRow(index, 'categoria', e.target.value)}
                                                >
                                                    <MenuItem value="ELIMINATORIA">Eliminatoria (Llaves)</MenuItem>
                                                    <MenuItem value="FASE_GRUPOS">Fase de Grupos</MenuItem>
                                                    <MenuItem value="TODOS_CONTRA_TODOS">Todos contra Todos</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                label="Costo ($)"
                                                type="number"
                                                size="small"
                                                value={torneo.costoInscripcion}
                                                onChange={(e) => handleUpdateTournamentRow(index, 'costoInscripcion', parseFloat(e.target.value))}
                                                sx={{ width: 100 }}
                                            />

                                            <IconButton color="error" onClick={() => handleRemoveTournamentRow(index)} disabled={torneos.length === 1}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Paper>
                                    ))}

                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddTournamentRow}
                                        variant="outlined"
                                        sx={{ borderStyle: 'dashed', borderWidth: 2, p: 2, borderRadius: 2, color: 'text.secondary', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1', borderStyle: 'dashed', borderWidth: 2 } }}
                                    >
                                        Agregar Otra Disciplina
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* 3. Edición de Torneo Existente (Legacy UI) */}
                        {tournamentToEdit && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: '#001F52', fontWeight: 600 }}>
                                    Configuración del Torneo
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Disciplina</InputLabel>
                                        <Select
                                            value={editDisciplina}
                                            onChange={(e) => setEditDisciplina(e.target.value)}
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
                                            value={editCategoria}
                                            onChange={(e) => setEditCategoria(e.target.value)}
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
                                            value={editGenero}
                                            onChange={(e) => setEditGenero(e.target.value)}
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
                                        value={editCosto}
                                        onChange={(e) => setEditCosto(parseFloat(e.target.value) || 0)}
                                        fullWidth
                                        helperText="Ingrese 0 si la inscripción es gratuita"
                                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                                    />
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <TextField
                                        label="URL de la Imagen (Opcional)"
                                        value={editImage}
                                        onChange={(e) => setEditImage(e.target.value)}
                                        fullWidth
                                    />
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Equipos Inscritos
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                if (editSelectedTeams.length === teams.length) {
                                                    setEditSelectedTeams([]);
                                                } else {
                                                    setEditSelectedTeams(teams.map(t => t.id.toString()));
                                                }
                                            }}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {editSelectedTeams.length === teams.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                        </Button>
                                    </Box>
                                    <Box
                                        sx={{
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            p: 2,
                                        }}
                                    >
                                        {teams
                                            .filter(team => {
                                                if (!editGenero || editGenero === 'MIXTO') return true;
                                                return team.genero === editGenero || team.genero === 'MIXTO' || !team.genero;
                                            })
                                            .map((team) => (
                                                <FormControlLabel
                                                    key={team.id}
                                                    control={
                                                        <Checkbox
                                                            checked={editSelectedTeams.includes(team.id.toString())}
                                                            onChange={() => handleToggleTeam(team.id.toString())}
                                                        />
                                                    }
                                                    label={`${team.name || team.nombre} (${team.genero || 'MIXTO'})`}
                                                    sx={{ width: '100%', mb: 1, ml: 0 }}
                                                />
                                            ))}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                    <Button onClick={onClose} variant="outlined" size="large" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 4,
                            background: 'linear-gradient(135deg, #001F52 0%, #004B9B 100%)',
                            boxShadow: '0 4px 12px rgba(0, 31, 82, 0.2)'
                        }}
                    >
                        {tournamentToEdit ? 'Guardar Cambios' : 'Crear Campeonato y Torneos'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
