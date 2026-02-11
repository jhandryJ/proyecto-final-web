import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Chip,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { enrollmentsService } from '../services/enrollments.service';
import { teamsService, type Team as ServiceTeam } from '../services/teams.service';
import type { EquipoTorneo } from '../types';

interface EnrollmentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    torneoId: number;
    onSuccess: () => void;
}

export function EnrollmentManager({ isOpen, onClose, torneoId, onSuccess }: EnrollmentManagerProps) {
    const [enrollments, setEnrollments] = useState<EquipoTorneo[]>([]);
    const [teams, setTeams] = useState<ServiceTeam[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, torneoId]);

    const loadData = async () => {
        try {
            const [enrollmentsData, teamsData] = await Promise.all([
                enrollmentsService.getByTournament(torneoId),
                teamsService.getAll(),
            ]);
            setEnrollments(enrollmentsData);
            setTeams(teamsData);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('Error al cargar los datos');
        }
    };

    const handleEnroll = async () => {
        if (!selectedTeamId) return;

        setLoading(true);
        setError('');

        try {
            await enrollmentsService.enroll({
                equipoId: selectedTeamId as number,
                torneoId,
            });

            setSelectedTeamId('');
            await loadData();
            onSuccess();
        } catch (err: any) {
            console.error('Error al inscribir equipo:', err);
            setError(err.response?.data?.message || 'Error al inscribir el equipo');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (enrollmentId: number, newStatus: 'INSCRITO' | 'ACEPTADO') => {
        try {
            await enrollmentsService.updateStatus(enrollmentId, { estado: newStatus });
            await loadData();
            onSuccess();
        } catch (err: any) {
            console.error('Error al actualizar estado:', err);
            setError(err.response?.data?.message || 'Error al actualizar el estado');
        }
    };

    const handleRemove = async (enrollmentId: number) => {
        if (!window.confirm('¿Estás seguro de eliminar esta inscripción?')) return;

        try {
            await enrollmentsService.delete(enrollmentId);
            await loadData();
            onSuccess();
        } catch (err: any) {
            console.error('Error al eliminar inscripción:', err);
            setError(err.response?.data?.message || 'Error al eliminar la inscripción');
        }
    };

    const enrolledTeamIds = enrollments.map((e) => e.equipoId);
    const availableTeams = teams.filter((t) => !enrolledTeamIds.includes(t.id));

    const getStatusColor = (estado: string) => {
        return estado === 'ACEPTADO' ? 'success' : 'warning';
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    Gestión de Inscripciones
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Inscribir nuevo equipo */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Inscribir Equipo
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Seleccionar Equipo</InputLabel>
                                <Select
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value as number)}
                                    label="Seleccionar Equipo"
                                >
                                    {availableTeams.map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                onClick={handleEnroll}
                                disabled={!selectedTeamId || loading}
                                startIcon={<AddIcon />}
                                sx={{ minWidth: 150 }}
                            >
                                Inscribir
                            </Button>
                        </Box>
                    </Box>

                    {/* Lista de equipos inscritos */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Equipos Inscritos ({enrollments.length})
                        </Typography>
                        {enrollments.length === 0 ? (
                            <Alert severity="info">No hay equipos inscritos en este torneo</Alert>
                        ) : (
                            <List>
                                {enrollments.map((enrollment) => (
                                    <ListItem
                                        key={enrollment.id}
                                        sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {enrollment.estado === 'INSCRITO' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleUpdateStatus(enrollment.id, 'ACEPTADO')}
                                                    >
                                                        Aceptar
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleRemove(enrollment.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </Box>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body1">
                                                        {enrollment.equipo?.nombre || `Equipo #${enrollment.equipoId}`}
                                                    </Typography>
                                                    <Chip
                                                        label={enrollment.estado}
                                                        color={getStatusColor(enrollment.estado)}
                                                        size="small"
                                                    />
                                                </Box>
                                            }
                                            secondary={enrollment.equipo?.facultad}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" size="large">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
