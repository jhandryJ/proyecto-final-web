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

    // Mapear nombres de fase a números de ronda lógicos
    const getPhaseOrder = (fase: string | undefined): number => {
        if (!fase) return 0;
        const normalized = fase.toUpperCase();
        if (normalized.includes('FINAL') && !normalized.includes('SEMI') && !normalized.includes('OCTAVOS') && !normalized.includes('CUARTOS')) return 5;
        if (normalized.includes('SEMIFINAL')) return 4;
        if (normalized.includes('CUARTOS')) return 3;
        if (normalized.includes('OCTAVOS')) return 2;
        if (normalized.includes('DIECISEISAVOS')) return 1;
        return 0; // Unknown or Groups
    };

    // Agrupar enfrentamientos por ronda
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
        if (round === 5) return 'GRAN FINAL';
        if (round === 4) return 'SEMIFINALES';
        if (round === 3) return 'CUARTOS DE FINAL';
        if (round === 2) return 'OCTAVOS DE FINAL';
        if (round === 1) return 'DIECISEISAVOS DE FINAL';
        return `RONDA ${round}`;
    };

    // Determinar el ganador del torneo
    const finalRoundNumber = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 5;
    const finalMatch = rounds[finalRoundNumber]?.[0];
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
            p: 2, // Padding reducido
            minHeight: 'auto', // Altura mínima reducida
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
                gap: 2, // Gap reducido de 4 (32px) a 2 (16px)
                overflowX: 'auto',
                pb: 2, // Padding reducido
                px: 2,
                justifyContent: roundNumbers.length < 3 ? 'center' : 'flex-start',
                alignItems: 'center', // Cambiado de stretch a center
                minHeight: 'auto' // Removido minHeight fijo
            }}>
                {roundNumbers.map((roundNumber, index) => {
                    const roundMatches = rounds[roundNumber];
                    // Dividir partidos en pares
                    const pairs = [];
                    for (let i = 0; i < roundMatches.length; i += 2) {
                        pairs.push(roundMatches.slice(i, i + 2));
                    }

                    const isLastRound = index === roundNumbers.length - 1;

                    return (
                        <Box key={roundNumber} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center', // Centrar partidos verticalmente
                            gap: 4, // Agregar espacio entre pares/partidos
                            minWidth: 180, // Ancho reducido del contenedor de tarjeta de partido
                            animation: `fadeInUp 0.6s ease-out ${index * 0.2}s backwards`,
                            position: 'relative',
                            zIndex: 1,
                            py: 4 // Agregar padding vertical a la columna
                        }}>
                            <Typography
                                variant="subtitle2" // Fuente más pequeña
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    color: '#5c6bc0',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    fontSize: '0.7rem',
                                    mb: 2,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0
                                }}
                            >
                                {getRoundName(roundNumber)}
                            </Typography>

                            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {pairs.map((pair, pIndex) => (
                                    <Box key={pIndex} sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: pair.length === 2 ? 1 : 0, // Gap reducido entre partidos emparejados
                                        position: 'relative',
                                        my: 0.5
                                    }}>
                                        {pair.map((match) => (
                                            <Box key={match.id} sx={{ position: 'relative', zIndex: 2 }}>
                                                <MatchCard
                                                    match={match}
                                                    isAdmin={isAdmin}
                                                    onEdit={onEditMatch}
                                                />

                                                {/* Línea única para final o partidos impares sin par */}
                                                {!isMobile && !isLastRound && pair.length === 1 && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        right: -24, // Cerrar el espacio
                                                        top: '50%',
                                                        width: 24,
                                                        height: 2,
                                                        bgcolor: '#94a3b8',
                                                        borderRadius: 1
                                                    }} />
                                                )}
                                            </Box>
                                        ))}

                                        {/* Conector de corchete para pares */}
                                        {!isMobile && !isLastRound && pair.length === 2 && (
                                            <>
                                                {/* La forma del corchete conector */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: '25%', // Comenzar en el centro de la tarjeta superior
                                                    bottom: '25%', // Terminar en el centro de la tarjeta inferior
                                                    right: -12, // Extender a la derecha
                                                    width: 12, // Ancho de segmentos horizontales
                                                    borderRight: '2px solid #94a3b8',
                                                    borderTop: '2px solid #94a3b8',
                                                    borderBottom: '2px solid #94a3b8',
                                                    borderTopRightRadius: 8,
                                                    borderBottomRightRadius: 8,
                                                }} />

                                                {/* La línea horizontal a la siguiente ronda */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: -24, // Cerrar el espacio restante a la siguiente ronda (12 corchete + 12 espacio)
                                                    width: 12,
                                                    height: 2,
                                                    bgcolor: '#94a3b8',
                                                    transform: 'translateY(-1px)' // Alineación perfecta al centro
                                                }} />
                                            </>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    );
                })}

                {/* Sección del ganador */}
                {tournamentWinner && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 200, // Reducido
                        animation: 'fadeInUp 0.8s ease-out 0.8s backwards',
                        pl: 2,
                        mt: 0
                    }}>
                        <Paper elevation={8} sx={{
                            width: 180, // Reducido de 260
                            height: 180,
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'radial-gradient(circle at 30% 30%, #ffd700, #ffa000)',
                            color: 'white',
                            position: 'relative',
                            animation: 'pulse-gold 3s infinite',
                            border: '6px solid rgba(255,255,255,0.4)'
                        }}>
                            <TrophyIcon sx={{ fontSize: 50, mb: 1, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.2))' }} />
                            <Typography variant="overline" sx={{ fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1 }}>
                                CAMPEÓN
                            </Typography>
                            <Typography variant="h6" align="center" sx={{
                                fontWeight: 900,
                                px: 1,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                lineHeight: 1.1,
                                fontSize: '1rem'
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
    const team1Logo = match.equipoLocal?.logoUrl;

    // Verificar si es un partido Bye: Jugado/Finalizado pero sin oponente
    const isBye = isPlayed && !match.team2 && !match.equipoVisitante;

    const team2Name = isBye
        ? 'BYE (Pase directo)'
        : (match.team2 || match.equipoVisitante?.nombre || 'Por definir');
    const team2Logo = !isBye ? match.equipoVisitante?.logoUrl : undefined;

    let winnerName: string | null = null;
    if (isPlayed && match.result) {
        if (match.result.team1Score > match.result.team2Score) winnerName = team1Name;
        else if (match.result.team2Score > match.result.team1Score) winnerName = team2Name;
    }

    return (
        <Paper
            elevation={3}
            sx={{
                width: 190, // Slightly wider for logos
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                backdropFilter: 'blur(8px)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    '& .edit-button': { opacity: 1 }
                }
            }}
        >
            {isAdmin && onEdit && !isBye && (
                <IconButton
                    className="edit-button"
                    size="small"
                    onClick={() => onEdit(match)}
                    sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        zIndex: 3,
                        opacity: 0,
                        padding: 0.5,
                        transition: 'opacity 0.2s',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' },
                        boxShadow: 1
                    }}
                >
                    <EditIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
            )}
            <Box>
                <TeamRow
                    name={team1Name}
                    logo={team1Logo}
                    score={isBye ? undefined : match.result?.team1Score}
                    isWinner={winnerName === team1Name}
                    isPlayed={isPlayed}
                    hideScore={isBye}
                />
                <Box sx={{ height: 1, bgcolor: 'rgba(0,0,0,0.05)', mx: 1.5 }} />
                <TeamRow
                    name={team2Name}
                    logo={team2Logo}
                    score={isBye ? undefined : match.result?.team2Score}
                    isWinner={winnerName === team2Name}
                    isPlayed={isPlayed}
                    isByeSlot={isBye}
                />
            </Box>
            <Box sx={{
                bgcolor: 'rgba(241, 245, 249, 0.8)',
                py: 0.5,
                px: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(0,0,0,0.05)'
            }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {match.fase || 'Eliminatoria'}
                </Typography>
                {isPlayed && (
                    <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#22c55e',
                        boxShadow: '0 0 4px #22c55e'
                    }} />
                )}
            </Box>
        </Paper>
    );
};

interface TeamRowProps {
    name: string;
    logo?: string;
    score: number | undefined;
    isWinner: boolean;
    isPlayed: boolean | undefined;
    hideScore?: boolean;
    isByeSlot?: boolean;
}

const TeamRow = ({ name, logo, score, isWinner, isPlayed, hideScore, isByeSlot }: TeamRowProps) => (
    <Box sx={{
        p: 1.2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isWinner ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(255,255,255,0) 100%)' : 'transparent',
        position: 'relative',
        opacity: isByeSlot ? 0.6 : 1
    }}>
        {isWinner && (
            <Box sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: '#22c55e',
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4
            }} />
        )}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ maxWidth: '80%', flexGrow: 1 }}>
            <Avatar
                src={logo}
                alt={name}
                sx={{
                    width: 24,
                    height: 24,
                    fontSize: 10,
                    fontWeight: 'bold',
                    bgcolor: isWinner ? '#22c55e' : (isByeSlot ? 'transparent' : '#f1f5f9'),
                    color: isWinner ? 'white' : '#64748b',
                    border: isByeSlot ? '1px dashed #cbd5e1' : '1px solid rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)' }
                }}
            >
                {isByeSlot ? '-' : name.charAt(0)}
            </Avatar>
            <Typography
                variant="body2"
                sx={{
                    fontWeight: isWinner ? 700 : 500,
                    color: isPlayed && !isWinner ? '#64748b' : '#1e293b',
                    fontSize: '0.8rem',
                    fontStyle: isByeSlot ? 'italic' : 'normal',
                    lineHeight: 1.2
                }}
                noWrap
            >
                {name}
            </Typography>
        </Stack>
        {!isByeSlot && !hideScore && (
            <Box sx={{
                minWidth: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isWinner ? '#22c55e' : (score !== undefined ? '#f1f5f9' : 'transparent'),
                color: isWinner ? 'white' : '#64748b',
                borderRadius: 1,
                fontSize: '0.85rem',
                fontWeight: 700
            }}>
                {score !== undefined ? score : '-'}
            </Box>
        )}
    </Box>
);
