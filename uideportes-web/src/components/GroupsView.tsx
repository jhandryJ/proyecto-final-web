import React, { useMemo } from 'react';
import { Box, Paper, Typography, Grid, Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Avatar } from '@mui/material';
import { GppGood, Groups as GroupsIcon, Edit as EditIcon, AccessTime as TimeIcon, Place as PlaceIcon } from '@mui/icons-material';
import type { Group, Matchup } from '../types';
import { IconButton } from '@mui/material';

interface GroupsViewProps {
    groups: Group[];
    matchups?: Matchup[];
    isAdmin?: boolean;
    onEditMatch?: (match: Matchup) => void;
}

interface TeamStats {
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    gc: number;
    gd: number;
    points: number;
    isQualified?: boolean;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ groups, matchups = [], isAdmin, onEditMatch }) => {

    // Calculate standings whenever groups or matchups change
    const standings = useMemo(() => {
        const stats: Record<string, TeamStats[]> = {};

        // 1. Initialize stats for all teams in groups
        groups.forEach(group => {
            // Normalize ID/Name
            const groupId = (group.id ?? group.name ?? 'unknown').toString();

            if (!stats[groupId]) {
                stats[groupId] = [];
            }

            if (group.teams) {
                group.teams.forEach(team => {
                    const teamName = typeof team === 'string' ? team : 'Equipo'; // Should ideally be an object with ID
                    const existingTeam = stats[groupId].find(t => t.name === teamName);
                    // Avoid duplicates if data is messy
                    if (!existingTeam) {
                        stats[groupId].push({
                            name: teamName,
                            played: 0,
                            won: 0,
                            drawn: 0,
                            lost: 0,
                            gf: 0,
                            gc: 0,
                            gd: 0,
                            points: 0
                        });
                    }
                });
            }
        });

        // 2. Process matches
        // Only consider matches in 'GRUPOS' phase or if we assume all matches passed are relevant
        const groupMatches = matchups.filter(m => !m.fase || m.fase === 'GRUPOS' || m.fase.includes('GRUPO'));

        groupMatches.forEach(match => {
            if (match.estado !== 'FINALIZADO') return;

            const team1Name = match.team1 || match.equipoLocal?.nombre;
            const team2Name = match.team2 || match.equipoVisitante?.nombre;

            if (!team1Name || !team2Name) return;

            const score1 = match.result?.team1Score ?? match.marcadorLocal ?? 0;
            const score2 = match.result?.team2Score ?? match.marcadorVisitante ?? 0;

            // Find which group these teams belong to
            // This is O(G*T) but usually small numbers.
            for (const groupId in stats) {
                const team1Stats = stats[groupId]?.find(s => s.name === team1Name);
                const team2Stats = stats[groupId]?.find(s => s.name === team2Name);

                // Assuming teams play within their group. 
                // If both found in same group, update stats. 

                if (team1Stats) {
                    team1Stats.played += 1;
                    team1Stats.gf += score1;
                    team1Stats.gc += score2;
                    team1Stats.gd = team1Stats.gf - team1Stats.gc;
                    if (score1 > score2) team1Stats.points += 3;
                    else if (score1 === score2) team1Stats.points += 1;

                    if (score1 > score2) team1Stats.won += 1;
                    else if (score1 === score2) team1Stats.drawn += 1;
                    else team1Stats.lost += 1;
                }

                if (team2Stats) {
                    team2Stats.played += 1;
                    team2Stats.gf += score2;
                    team2Stats.gc += score1;
                    team2Stats.gd = team2Stats.gf - team2Stats.gc;
                    if (score2 > score1) team2Stats.points += 3;
                    else if (score2 === score1) team2Stats.points += 1;

                    if (score2 > score1) team2Stats.won += 1;
                    else if (score2 === score1) team2Stats.drawn += 1;
                    else team2Stats.lost += 1;
                }
            }
        });

        // 3. Sort and Determine qualifiers
        for (const groupId in stats) {
            stats[groupId].sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });

            // Mark top 2 as qualified
            stats[groupId].forEach((team, index) => {
                if (index < 2) team.isQualified = true;
            });
        }

        return stats;

    }, [groups, matchups]);


    return (
        <Box sx={{
            p: { xs: 2, md: 4 },
            minHeight: 500,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 2
        }}>
            <style>
                {`
                    @keyframes slideInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .glass-card {
                        background: rgba(255, 255, 255, 0.9);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                `}
            </style>

            <Typography
                variant="h4"
                align="center"
                sx={{
                    fontWeight: '900',
                    mb: 6,
                    color: '#1a237e',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                }}
            >
                <GroupsIcon fontSize="large" sx={{ color: '#3949ab' }} />
                Fase de Grupos
            </Typography>

            <Grid container spacing={4} justifyContent="center">
                {groups.map((group, index) => {
                    const groupId = (group.id ?? group.name ?? 'unknown').toString();
                    const teamStats = standings[groupId] || [];

                    return (
                        <Grid size={{ xs: 12, md: 6, lg: 6 }} key={group.id || index}>
                            <Paper
                                className="glass-card"
                                elevation={4}
                                sx={{
                                    p: 0,
                                    height: '100%',
                                    borderRadius: 1.5,
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    animation: `slideInUp 0.6s ease-out ${index * 0.15}s backwards`,
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 15px 30px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                {/* Header */}
                                <Box sx={{
                                    p: 2.5,
                                    background: 'linear-gradient(120deg, #1a237e 0%, #3949ab 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {(group.name || 'G').charAt((group.name?.length || 1) - 1)}
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">
                                            {group.name || 'Grupo sin nombre'}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        icon={<GppGood style={{ color: '#b2dfdb' }} />}
                                        label="Top 2"
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            color: '#e0f2f1',
                                            fontWeight: 'bold',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    />
                                </Box>

                                {/* Standings Table */}
                                <TableContainer sx={{ p: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#5c6bc0', borderBottom: '2px solid #e8eaf6' }}>EQUIPO</TableCell>
                                                <Tooltip title="Puntos"><TableCell align="center" sx={{ fontWeight: 'bold', color: '#1a237e', borderBottom: '2px solid #e8eaf6' }}>PTS</TableCell></Tooltip>
                                                <Tooltip title="Partidos Jugados"><TableCell align="center" sx={{ color: '#7986cb', borderBottom: '2px solid #e8eaf6' }}>PJ</TableCell></Tooltip>
                                                <Tooltip title="Diferencia de Goles"><TableCell align="center" sx={{ color: '#7986cb', borderBottom: '2px solid #e8eaf6', display: { xs: 'none', sm: 'table-cell' } }}>DG</TableCell></Tooltip>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {teamStats.length > 0 ? (
                                                teamStats.map((stat, tIdx) => (
                                                    <TableRow
                                                        key={tIdx}
                                                        sx={{
                                                            bgcolor: stat.isQualified ? 'rgba(76, 175, 80, 0.04)' : tIdx % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'transparent',
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <TableCell component="th" scope="row" sx={{ borderBottom: '1px solid #f5f5f5' }}>
                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: '#9e9e9e',
                                                                        width: 20,
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    {tIdx + 1}
                                                                </Typography>
                                                                <Avatar sx={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    fontSize: 12,
                                                                    bgcolor: stat.isQualified ? '#66bb6a' : '#bdbdbd'
                                                                }}>
                                                                    {stat.name.charAt(0)}
                                                                </Avatar>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={stat.isQualified ? '700' : '500'}
                                                                    color={stat.isQualified ? 'text.primary' : 'text.secondary'}
                                                                >
                                                                    {stat.name}
                                                                </Typography>
                                                                {stat.isQualified && (
                                                                    <GppGood fontSize="small" color="success" sx={{ width: 16, height: 16, opacity: 0.8 }} />
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: '800', fontSize: '1.1rem', color: '#1a237e', borderBottom: '1px solid #f5f5f5' }}>
                                                            {stat.points}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ color: '#616161', borderBottom: '1px solid #f5f5f5' }}>{stat.played}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#616161', borderBottom: '1px solid #f5f5f5', display: { xs: 'none', sm: 'table-cell' } }}>
                                                            <Chip
                                                                label={stat.gd > 0 ? `+${stat.gd}` : stat.gd}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.75rem',
                                                                    bgcolor: stat.gd > 0 ? 'rgba(76, 175, 80, 0.1)' : stat.gd < 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0,0,0,0.05)',
                                                                    color: stat.gd > 0 ? 'green' : stat.gd < 0 ? 'red' : 'grey'
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                                                        <Stack alignItems="center" spacing={1}>
                                                            <GroupsIcon sx={{ color: '#e0e0e0', fontSize: 40 }} />
                                                            <Typography variant="body2">No hay datos disponibles</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Group Matches Section */}
                                <Box sx={{ p: 2, borderTop: '1px solid #e8eaf6', bgcolor: 'rgba(232, 245, 233, 0.02)' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: '#5c6bc0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Partidos del Grupo
                                    </Typography>
                                    <Stack spacing={1}>
                                        {matchups.filter(m => {
                                            const team1Name = m.team1 || m.equipoLocal?.nombre;
                                            const team2Name = m.team2 || m.equipoVisitante?.nombre;
                                            return teamStats.some(s => s.name === team1Name || s.name === team2Name);
                                        }).map((match) => {
                                            const isFinished = match.estado === 'FINALIZADO';
                                            return (
                                                <Paper
                                                    key={match.id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.01)', borderColor: 'primary.main' }
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {match.team1 || match.equipoLocal?.nombre} {isFinished ? match.marcadorLocal : ''}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">vs</Typography>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {match.team2 || match.equipoVisitante?.nombre} {isFinished ? match.marcadorVisitante : ''}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                                <TimeIcon sx={{ fontSize: 14 }} />
                                                                {match.fechaHora ? new Date(match.fechaHora).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short', hour12: true }) : 'Fecha por definir'}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                                <PlaceIcon sx={{ fontSize: 14 }} />
                                                                {match.cancha?.nombre || 'Cancha por definir'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {isAdmin && onEditMatch && (
                                                        <Tooltip title="Programar partido">
                                                            <IconButton size="small" onClick={() => onEditMatch(match)} color="primary">
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Paper>
                                            );
                                        })}
                                        {matchups.filter(m => {
                                            const team1Name = m.team1 || m.equipoLocal?.nombre;
                                            const team2Name = m.team2 || m.equipoVisitante?.nombre;
                                            return teamStats.some(s => s.name === team1Name || s.name === team2Name);
                                        }).length === 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                                                    No hay partidos generados para este grupo aún.
                                                </Typography>
                                            )}
                                    </Stack>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};
