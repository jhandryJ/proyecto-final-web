import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    CircularProgress
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    CalendarMonth as CalendarIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { TeamCard } from '../../components/TeamCard';
import { CreateTeamModal } from '../../components/CreateTeamModal';
import { TournamentCard } from '../../components/TournamentCard';
import { authService } from '../../services/auth.service';
import { teamService } from '../../services/team.service';
import { tournamentService } from '../../services/tournament.service';
import { useNavigate } from 'react-router-dom';

export const UserDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('my-team');
    const [user, setUser] = useState<any>(null);
    const [myTeam, setMyTeam] = useState<any>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar mi equipo (si existe)
            // Nota: Se debe implementar este endpoint en backend o filtrar
            // Por ahora simulamos si no existe el endpoint específico
            const teams = await teamService.getAll();
            const currentUser = authService.getCurrentUser();
            const foundTeam = teams.find((t: any) => t.capitanId === currentUser.id) ||
                teams.find((t: any) => t.miembros?.some((m: any) => m.usuarioId === currentUser.id)); // Ajustar lógica según backend
            setMyTeam(foundTeam);

            const tourneys = await tournamentService.getAll();
            setTournaments(tourneys);
        } catch (error) {
            console.error('Error loading data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (teamData: any) => {
        try {
            await teamService.create(teamData);
            loadData(); // Recargar datos
            setIsCreateTeamModalOpen(false);
        } catch (error) {
            console.error('Error creating team', error);
            alert('Error al crear el equipo');
        }
    };

    // User Menu Items
    const userMenuItems = [
        { id: 'my-team', label: 'Mi Equipo', icon: GroupIcon },
        { id: 'tournaments', label: 'Torneos Disponibles', icon: TrophyIcon },
        { id: 'matches', label: 'Mis Partidos', icon: CalendarIcon },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                menuItems={userMenuItems}
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                    Bienvenido, {user?.nombres}
                </Typography>

                {activeTab === 'my-team' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Mi Equipo
                            </Typography>
                            {!myTeam && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsCreateTeamModalOpen(true)}
                                >
                                    Crear Equipo
                                </Button>
                            )}
                        </Box>

                        {myTeam ? (
                            <Box sx={{ maxWidth: 400 }}>
                                <TeamCard
                                    team={myTeam}
                                    onViewDetails={() => console.log('View team details')}
                                    onDelete={() => alert('Acción no permitida')}
                                />
                            </Box>
                        ) : (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    No perteneces a ningún equipo aún. Crea uno o espera a ser invitado.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                )}

                {activeTab === 'tournaments' && (
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Torneos Disponibles
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: 3
                        }}>
                            {tournaments.map((t) => (
                                <TournamentCard
                                    key={t.id}
                                    tournament={t}
                                    onViewDetails={() => console.log('View details', t)}
                                    onEdit={() => alert('No tienes permisos')}
                                    onDelete={() => alert('No tienes permisos')}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {activeTab === 'matches' && (
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Mis Partidos
                        </Typography>
                        <Paper sx={{ p: 3 }}>
                            <Typography color="text.secondary">
                                Próximamente: Calendario de partidos de tu equipo.
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </Container>

            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                onCreateTeam={handleCreateTeam}
            />
        </Box>
    );
};
