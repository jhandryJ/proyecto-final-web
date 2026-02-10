import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Paper,
    Button,
    Stack,
    Chip,
    CircularProgress,
    Slider,
    Grid
} from '@mui/material';
import {
    Close as CloseIcon,
    Shuffle as ShuffleIcon,
    Group as GroupIcon,
    EmojiEvents as TrophyIcon,
    SportsSoccer as SportsIcon,
    ArrowForward as ArrowForwardIcon,
    RestartAlt as RestartAltIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import type { Tournament } from '../types';
import { BracketView } from './BracketView';

interface TournamentDetailsModalProps {
    tournament: Tournament | null;
    onClose: () => void;
    onDrawMatchups: (tournamentId: number, settings?: any) => void;
    onPromoteToKnockout: (tournamentId: number) => void;
}

export function TournamentDetailsModal({
    tournament,
    onClose,
    onDrawMatchups,
    onPromoteToKnockout
}: TournamentDetailsModalProps) {
    const [isDrawing, setIsDrawing] = useState(false);

    // Draw Wizard State
    const [drawStep, setDrawStep] = useState<0 | 1 | 2>(0); // 0: View, 1: Config, 2: Preview
    const [groupsCount, setGroupsCount] = useState(2);
    const [previewAssignments, setPreviewAssignments] = useState<Record<string, any[]>>({});

    // Tabs State
    const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups');

    useEffect(() => {
        if (!tournament) {
            setDrawStep(0);
            setGroupsCount(2);
            setPreviewAssignments({});
            setActiveTab('groups');
        } else {
            // Reset groupsCount if teams change
            const teamsParams = tournament.teams || [];
            const maxGroups = Math.min(8, Math.floor(teamsParams.length / 2));
            if (groupsCount > maxGroups) {
                setGroupsCount(Math.max(2, maxGroups));
            }

            // Auto-select tab
            if (tournament.format === 'groups' && (!tournament.matchups || tournament.matchups.length === 0)) {
                setActiveTab('groups');
            } else if (tournament.format === 'knockout' || tournament.format === 'single-elimination') {
                setActiveTab('bracket');
            } else {
                setActiveTab('groups');
            }
        }
    }, [tournament]);

    if (!tournament) return null;

    const canDraw = tournament.status === 'pending' && (tournament.teams?.length || 0) >= 2;

    const handleStartDrawConfig = () => {
        setDrawStep(1);
    };

    const handleGeneratePreview = () => {
        const sourceTeams = tournament.teamDetails || (tournament.teams || []).map((name, idx) => ({ id: -idx, name }));

        const teams = [...sourceTeams];
        const shuffled = teams.sort(() => 0.5 - Math.random());
        const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const newAssignments: Record<string, any[]> = {};

        for (let i = 0; i < groupsCount; i++) {
            newAssignments[groupNames[i]] = [];
        }

        shuffled.forEach((team, index) => {
            const groupIndex = index % groupsCount;
            const groupName = groupNames[groupIndex];
            newAssignments[groupName].push(team);
        });

        setPreviewAssignments(newAssignments);
        setDrawStep(2);
    };

    const handleConfirmDraw = async () => {
        setIsDrawing(true);

        const manualAssignments: Record<string, number[]> = {};
        let hasRealIds = true;

        Object.entries(previewAssignments).forEach(([groupName, teams]) => {
            manualAssignments[groupName] = teams.map((t: any) => {
                if (t.id <= 0) hasRealIds = false;
                return t.id;
            });
        });

        const settings: any = {
            groupsCount
        };

        if (hasRealIds) {
            settings.manualAssignments = manualAssignments;
        }

        await onDrawMatchups(tournament.id, settings);
        setIsDrawing(false);
        setDrawStep(0);
        setActiveTab('groups'); // Go to groups after draw
    };

    return (
        <Dialog
            open={!!tournament}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2, height: '90vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {tournament.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsIcon fontSize="small" />
                        {tournament.sport}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Stack direction="row" spacing={2}>
                    <Button
                        color={activeTab === 'groups' ? 'primary' : 'inherit'}
                        onClick={() => setActiveTab('groups')}
                        sx={{
                            borderBottom: activeTab === 'groups' ? 2 : 0,
                            borderRadius: 0,
                            px: 3,
                            py: 1.5,
                            fontWeight: activeTab === 'groups' ? 'bold' : 'normal'
                        }}
                    >
                        {tournament.format === 'groups' ? 'Fase de Grupos' : 'Equipos'}
                    </Button>
                    <Button
                        color={activeTab === 'bracket' ? 'primary' : 'inherit'}
                        onClick={() => setActiveTab('bracket')}
                        sx={{
                            borderBottom: activeTab === 'bracket' ? 2 : 0,
                            borderRadius: 0,
                            px: 3,
                            py: 1.5,
                            fontWeight: activeTab === 'bracket' ? 'bold' : 'normal'
                        }}
                    >
                        Fase Final (Llaves)
                    </Button>
                </Stack>
            </Box>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                {drawStep === 0 ? (
                    // VIEW MODE
                    activeTab === 'groups' ? (
                        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                            {/* Groups / Teams View */}
                            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                    <GroupIcon color="primary" />
                                    Equipos Participantes ({tournament.teams?.length || 0})
                                </Typography>

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                                    {(tournament.teams || []).map((team, index) => (
                                        <Chip
                                            key={index}
                                            label={team}
                                            variant="outlined"
                                            sx={{ justifyContent: 'flex-start', py: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            </Paper>

                            {/* Groups Display */}
                            {tournament.groups && tournament.groups.length > 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                            <TrophyIcon color="primary" />
                                            Grupos
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                            startIcon={<ArrowForwardIcon />}
                                            onClick={() => {
                                                if (window.confirm('¿Deseas finalizar la fase de grupos y generar las llaves para la siguiente fase? Asegúrate de que todos los partidos de grupo estén jugados.')) {
                                                    onPromoteToKnockout(tournament.id);
                                                }
                                            }}
                                        >
                                            Generar Fase Final
                                        </Button>
                                    </Box>
                                    <Grid container spacing={3}>
                                        {tournament.groups.map((group, index) => (
                                            <Grid size={{ xs: 12, md: 6 }} key={index}>
                                                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                                        {group.name}
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {group.teams?.map((team, tIdx) => (
                                                            <Box key={tIdx} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                                <Typography variant="body2" fontWeight="500">{team}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            {/* Draw Actions */}
                            {canDraw && (
                                <Box sx={{ mt: 4, textAlign: 'center' }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={tournament.format === 'groups' ? handleStartDrawConfig : handleConfirmDraw}
                                        disabled={isDrawing}
                                        startIcon={isDrawing ? <CircularProgress size={20} color="inherit" /> : <ShuffleIcon />}
                                        sx={{
                                            py: 1.5,
                                            px: 4,
                                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                            color: 'white'
                                        }}
                                    >
                                        {isDrawing ? 'Sorteando...' : tournament.format === 'groups' ? 'Configurar Sorteo de Grupos' : 'Realizar Sorteo de Llaves'}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        // BRACKET VIEW
                        <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {tournament.matchups && tournament.matchups.length > 0 ? (
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                    <BracketView matchups={tournament.matchups} />
                                </Box>
                            ) : (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'text.secondary',
                                    bgcolor: 'background.default',
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    p: 4
                                }}>
                                    <ShuffleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
                                    <Typography variant="h6" gutterBottom>Fase Final no iniciada</Typography>
                                    <Typography variant="body2" align="center" sx={{ maxWidth: 400 }}>
                                        {tournament.format === 'groups'
                                            ? 'Una vez finalizada la fase de grupos, aquí se generarán los cruces eliminatorios.'
                                            : 'Debes realizar el sorteo para generar los enfrentamientos.'}
                                    </Typography>
                                </Box>
                            )}

                            {/* Regenerate Button for existing brackets */}
                            {activeTab === 'bracket' && tournament.matchups && tournament.matchups.length > 0 && (
                                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<RestartAltIcon />}
                                        onClick={() => {
                                            if (window.confirm('¿Estás seguro de que deseas regenerar las llaves? SE BORRARÁN TODOS LOS PROGRESOS Y RESULTADOS ACTUALES.')) {
                                                onDrawMatchups(tournament.id, { force: true });
                                            }
                                        }}
                                    >
                                        Regenerar Llaves
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )
                ) : drawStep === 1 ? (
                    // CONFIG STEP
                    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
                            Configuración de Grupos
                        </Typography>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                            Selecciona cuántos grupos deseas crear para distribuir los {tournament.teams?.length || 0} equipos.
                        </Typography>

                        <Paper sx={{ p: 4, mb: 4 }}>
                            <Typography gutterBottom>Número de Grupos: <strong>{groupsCount}</strong></Typography>
                            <Slider
                                value={groupsCount}
                                onChange={(_, val) => setGroupsCount(val as number)}
                                step={1}
                                marks
                                min={2}
                                max={Math.min(8, Math.floor((tournament.teams?.length || 0) / 2))}
                                valueLabelDisplay="auto"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Aprox. {Math.ceil((tournament.teams?.length || 0) / groupsCount)} equipos por grupo.
                            </Typography>
                        </Paper>

                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button onClick={() => setDrawStep(0)} color="inherit">
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardIcon />}
                                onClick={handleGeneratePreview}
                            >
                                Siguiente: Previsualizar
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    // PREVIEW STEP
                    <Box>
                        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
                            Previsualización de Grupos
                        </Typography>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                            Revisa la distribución aleatoria. Si no estás conforme, puedes regenerarla.
                        </Typography>

                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {Object.entries(previewAssignments).map(([groupName, teams]) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={groupName}>
                                    <Paper sx={{ p: 2, height: '100%', borderTop: '4px solid', borderColor: 'primary.main' }}>
                                        <Typography variant="h6" gutterBottom color="primary.main">
                                            Grupo {groupName}
                                        </Typography>
                                        <Stack spacing={1}>
                                            {teams.map((team: any, idx: number) => (
                                                <Box key={idx} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                                    {team.name || team}
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button onClick={() => setDrawStep(1)} color="inherit">
                                Atrás
                            </Button>
                            <Button
                                startIcon={<RestartAltIcon />}
                                onClick={handleGeneratePreview}
                                variant="outlined"
                            >
                                Redistribuir Aleatoriamente
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={isDrawing ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                                onClick={handleConfirmDraw}
                                disabled={isDrawing}
                            >
                                {isDrawing ? 'Generando...' : 'Confirmar y Generar Partidos'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
