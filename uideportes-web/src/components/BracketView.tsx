import React from 'react';
import { Box, Paper, Typography, Stack, Avatar, useTheme, useMediaQuery, IconButton } from '@mui/material';
import { EmojiEvents as TrophyIcon, Edit as EditIcon } from '@mui/icons-material';
import type { Matchup } from '../types';

interface BracketViewProps {
    matchups: Matchup[];
    isAdmin?: boolean;
    onEditMatch?: (match: Matchup) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ matchups, isAdmin, onEditMatch }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Map phase names to logical round numbers
    const getPhaseOrder = (fase: string | undefined): number => {
        if (!fase) return 0;
        const normalized = fase.toUpperCase();
        if (normalized.includes('FINAL') && !normalized.includes('SEMI') && !normalized.includes('OCTAVOS') && !normalized.includes('CUARTOS')) return 4;
        if (normalized.includes('SEMIFINAL')) return 3;
        if (normalized.includes('CUARTOS')) return 2;
        if (normalized.includes('OCTAVOS')) return 1;
        return 0; // Unknown or Groups
    };

    // Group matchups by round
    const rounds = matchups.reduce((acc, match) => {
        let round = match.round;
        if (!round && match.fase) {
            round = getPhaseOrder(match.fase);
        }
        round = round || 1;

        const team1 = match.team1 || match.equipoLocal?.nombre;
        const team2 = match.team2 || match.equipoVisitante?.nombre;
        const isTBD = (!team1 || team1 === 'Por definir') && (!team2 || team2 === 'Por definir');

        if (round === 1 && isTBD) return acc;

        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {} as Record<number, Matchup[]>);

    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    const getRoundName = (round: number) => {
        if (round === 4) return 'GRAN FINAL';
        if (round === 3) return 'SEMIFINALES';
        if (round === 2) return 'CUARTOS DE FINAL';
        if (round === 1) return 'OCTAVOS DE FINAL';
        return `RONDA ${round}`;
    };

    // Determine tournament winner
    const finalMatch = rounds[4]?.[0];
    let tournamentWinner: string | null = null;
    if (finalMatch && finalMatch.result?.played) {
        if (finalMatch.result.team1Score > finalMatch.result.team2Score) {
            tournamentWinner = finalMatch.team1 || finalMatch.equipoLocal?.nombre || null;
        } else if (finalMatch.result.team2Score > finalMatch.result.team1Score) {
            tournamentWinner = finalMatch.team2 || finalMatch.equipoVisitante?.nombre || null;
        }
    }

    return (
        <Box sx={{
            p: { xs: 2, md: 4 },
            minHeight: 600,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 2,
            overflow: 'hidden'
        }}>
            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulse-gold {
                        0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
                        70% { box-shadow: 0 0 0 15px rgba(255, 215, 0, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
                    }
                    .bracket-container {
                        scrollbar-width: thin;
                        scrollbar-color: #888 #f1f1f1;
                    }
                `}
            </style>

            <Typography variant="h4" align="center" sx={{
                fontWeight: 900,
                color: '#1a237e',
                mb: 6,
                textTransform: 'uppercase',
                letterSpacing: 3,
                textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
            }}>
                Fase Eliminatoria
            </Typography>

            <Box className="bracket-container" sx={{
                display: 'flex',
                gap: { xs: 4, md: 8 },
                overflowX: 'auto',
                pb: 4,
                px: 2,
                justifyContent: roundNumbers.length < 3 ? 'center' : 'flex-start',
                alignItems: 'stretch', // Changed to stretch for alignment
                minHeight: 500
            }}>
                {roundNumbers.map((roundNumber, index) => {
                    const roundMatches = rounds[roundNumber];
                    // Chunk matches into pairs
                    const pairs = [];
                    for (let i = 0; i < roundMatches.length; i += 2) {
                        pairs.push(roundMatches.slice(i, i + 2));
                    }

                    const isLastRound = index === roundNumbers.length - 1;

                    return (
                        <Box key={roundNumber} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-around',
                            minWidth: 300,
                            animation: `fadeInUp 0.6s ease-out ${index * 0.2}s backwards`,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <Typography
                                variant="subtitle1"
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    color: '#5c6bc0',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    fontSize: '0.9rem',
                                    mb: 2,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0
                                }}
                            >
                                {getRoundName(roundNumber)}
                            </Typography>

                            <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flexGrow: 1 }}>
                                {pairs.map((pair, pIndex) => (
                                    <Box key={pIndex} sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: pair.length === 2 ? 4 : 0,
                                        position: 'relative',
                                        my: 2
                                    }}>
                                        {pair.map((match) => (
                                            <Box key={match.id} sx={{ position: 'relative', zIndex: 2 }}>
                                                <MatchCard
                                                    match={match}
                                                    isAdmin={isAdmin}
                                                    onEdit={onEditMatch}
                                                />

                                                {/* Single Line for final or odd matches without pair */}
                                                {!isMobile && !isLastRound && pair.length === 1 && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        right: -32,
                                                        top: '50%',
                                                        width: 32,
                                                        height: 2,
                                                        bgcolor: '#bdbdbd'
                                                    }} />
                                                )}
                                            </Box>
                                        ))}

                                        {/* Connector Bracket for Pairs */}
                                        {!isMobile && !isLastRound && pair.length === 2 && (
                                            <>
                                                {/* Vertical Line */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    right: -20,
                                                    top: '25%', // Approx center of first card (adjust if card height changes)
                                                    bottom: '25%', // Approx center of second card
                                                    width: 2,
                                                    bgcolor: '#bdbdbd'
                                                }} />
                                                {/* Top Horizontal stub */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    right: -20,
                                                    top: '25%',
                                                    width: 20,
                                                    height: 2,
                                                    bgcolor: '#bdbdbd'
                                                }} />
                                                {/* Bottom Horizontal stub */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    right: -20,
                                                    bottom: '25%',
                                                    width: 20,
                                                    height: 2,
                                                    bgcolor: '#bdbdbd'
                                                }} />
                                                {/* Center Outgoing stub */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    right: -52, // Extend to next column
                                                    top: '50%',
                                                    width: 32,
                                                    height: 2,
                                                    bgcolor: '#bdbdbd'
                                                }} />
                                            </>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    );
                })}

                {/* Winner Section */}
                {tournamentWinner && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 320,
                        animation: 'fadeInUp 0.8s ease-out 0.8s backwards',
                        pl: 4,
                        mt: 6
                    }}>
                        <Paper elevation={12} sx={{
                            width: 260,
                            height: 260,
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'radial-gradient(circle at 30% 30%, #ffd700, #ffa000)',
                            color: 'white',
                            position: 'relative',
                            animation: 'pulse-gold 3s infinite',
                            border: '8px solid rgba(255,255,255,0.4)'
                        }}>
                            <TrophyIcon sx={{ fontSize: 80, mb: 1, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.2))' }} />
                            <Typography variant="overline" sx={{ fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}>
                                CAMPEÓN
                            </Typography>
                            <Typography variant="h5" align="center" sx={{
                                fontWeight: 900,
                                px: 2,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                lineHeight: 1.1
                            }}>
                                {tournamentWinner}
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const MatchCard = ({ match, isAdmin, onEdit }: { match: Matchup, isAdmin?: boolean, onEdit?: (m: Matchup) => void }) => {
    const isPlayed = match.result?.played;
    const team1Name = match.team1 || match.equipoLocal?.nombre || 'Por definir';
    const team2Name = match.team2 || match.equipoVisitante?.nombre || 'Por definir';

    let winnerName: string | null = null;
    if (isPlayed && match.result) {
        if (match.result.team1Score > match.result.team2Score) winnerName = team1Name;
        else if (match.result.team2Score > match.result.team1Score) winnerName = team2Name;
    }

    return (
        <Paper
            elevation={3}
            sx={{
                width: 280,
                borderRadius: 1,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    '& .edit-button': { opacity: 1 }
                }
            }}
        >
            {isAdmin && onEdit && (
                <IconButton
                    className="edit-button"
                    size="small"
                    onClick={() => onEdit(match)}
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        zIndex: 3,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                    }}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            )}
            <Box sx={{ bgcolor: 'white' }}>
                <TeamRow
                    name={team1Name}
                    score={match.result?.team1Score}
                    isWinner={winnerName === team1Name}
                    isPlayed={isPlayed}
                />
                <Box sx={{ height: 1, bgcolor: '#f0f0f0', mx: 2 }} />
                <TeamRow
                    name={team2Name}
                    score={match.result?.team2Score}
                    isWinner={winnerName === team2Name}
                    isPlayed={isPlayed}
                />
            </Box>
            <Box sx={{
                bgcolor: '#fafafa',
                py: 0.5,
                px: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f0f0f0'
            }}>
                <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 600, fontSize: '0.7rem' }}>
                    {match.fase || 'Eliminatoria'}
                </Typography>
                {isPlayed && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4caf50' }} />
                )}
            </Box>
        </Paper>
    );
};

const TeamRow = ({ name, score, isWinner, isPlayed }: { name: string, score: number | undefined, isWinner: boolean, isPlayed: boolean | undefined }) => (
    <Box sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isWinner ? 'linear-gradient(90deg, rgba(232, 245, 233, 0.5) 0%, rgba(255,255,255,0) 100%)' : 'transparent',
        position: 'relative'
    }}>
        {isWinner && (
            <Box sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: '#4caf50'
            }} />
        )}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ maxWidth: '80%' }}>
            <Avatar sx={{
                width: 28,
                height: 28,
                fontSize: 14,
                fontWeight: 'bold',
                bgcolor: isWinner ? '#4caf50' : '#e0e0e0',
                color: isWinner ? 'white' : '#757575'
            }}>
                {name.charAt(0)}
            </Avatar>
            <Typography
                variant="body1"
                sx={{
                    fontWeight: isWinner ? 700 : 500,
                    color: isPlayed && !isWinner ? '#757575' : '#212121',
                    fontSize: '0.95rem'
                }}
                noWrap
            >
                {name}
            </Typography>
        </Stack>
        <Typography
            variant="h6"
            sx={{
                fontWeight: 800,
                color: isWinner ? '#2e7d32' : '#757575',
                minWidth: 24,
                textAlign: 'center'
            }}
        >
            {score !== undefined ? score : '-'}
        </Typography>
    </Box>
);
