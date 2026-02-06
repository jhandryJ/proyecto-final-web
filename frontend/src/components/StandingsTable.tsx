import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Avatar,
    Stack
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import type { Team } from '../types';

interface StandingsTableProps {
    teams: Team[];
}

export function StandingsTable({ teams }: StandingsTableProps) {
    // Calculate points (3 for win, 1 for draw)
    const teamsWithPoints = teams.map(team => ({
        ...team,
        points: (team.wins || 0) * 3 + (team.draws || 0),
        played: (team.wins || 0) + (team.draws || 0) + (team.losses || 0),
        goalDiff: (team.goalsFor || 0) - (team.goalsAgainst || 0),
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return (b.goalsFor || 0) - (a.goalsFor || 0);
    });

    if (teams.length === 0) {
        return (
            <Box sx={{
                textAlign: 'center',
                py: 8,
                bgcolor: 'background.paper',
                borderRadius: 2,
                color: 'text.secondary'
            }}>
                <TrophyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography>No hay equipos registrados</Typography>
            </Box>
        );
    }

    const scoreLabel = teams.length > 0 && teams[0].sport === 'Fútbol' ? 'GF' : 'PF';
    const againstLabel = teams.length > 0 && teams[0].sport === 'Fútbol' ? 'GC' : 'PC';

    return (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de posiciones">
                <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Pos</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Equipo</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>PJ</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>G</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>E</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>P</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{scoreLabel}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{againstLabel}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>DIF</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>PTS</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {teamsWithPoints.map((team, index) => (
                        <TableRow
                            key={team.id}
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                bgcolor: index < 3 ? 'rgba(33, 150, 243, 0.04)' : 'inherit',
                                transition: 'background-color 0.2s',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <TableCell component="th" scope="row">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography fontWeight={index < 3 ? 'bold' : 'regular'} color={index < 3 ? 'primary' : 'text.primary'}>
                                        {index + 1}
                                    </Typography>
                                    {index === 0 && <TrophyIcon sx={{ fontSize: 16, color: '#FFD700' }} />}
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: team.color,
                                            fontSize: 14,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {team.name.charAt(0)}
                                    </Avatar>
                                    <Typography fontWeight="medium">
                                        {team.name}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell align="center">{team.played}</TableCell>
                            <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                {team.wins || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ color: 'text.secondary' }}>
                                {team.draws || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                                {team.losses || 0}
                            </TableCell>
                            <TableCell align="center">{team.goalsFor || 0}</TableCell>
                            <TableCell align="center">{team.goalsAgainst || 0}</TableCell>
                            <TableCell align="center">
                                <Typography
                                    component="span"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: team.goalDiff > 0 ? 'success.main' : team.goalDiff < 0 ? 'error.main' : 'text.secondary'
                                    }}
                                >
                                    {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {team.points}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
