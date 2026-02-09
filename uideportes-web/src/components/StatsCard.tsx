import { Paper, CardContent, Box, Typography, Avatar } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export function StatsCard({ title, value, icon: Icon, color = 'primary' }: StatsCardProps) {
    const getInstitutionColor = (c: string) => {
        switch (c) {
            case 'primary': return '#001F52';
            case 'secondary': return '#EDB112';
            case 'error': return '#EF4444';
            case 'success': return '#22C55E';
            default: return '#001F52';
        }
    };

    const instColor = getInstitutionColor(color);

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 20px 0 rgba(0, 31, 82, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px 0 rgba(0, 31, 82, 0.1)',
                    borderColor: instColor
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: 1.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="p" sx={{ fontWeight: 900, color: '#001F52', mt: 1, letterSpacing: -1 }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: instColor,
                            opacity: 0.15,
                            transform: 'scale(1.4)',
                            zIndex: 0
                        }} />
                        <Avatar
                            sx={{
                                background: `linear-gradient(135deg, ${instColor} 0%, ${instColor}DD 100%)`,
                                width: 56,
                                height: 56,
                                boxShadow: `0 8px 16px ${instColor}40`,
                                zIndex: 1
                            }}
                        >
                            <Icon size={24} color="white" />
                        </Avatar>
                    </Box>
                </Box>
            </CardContent>
        </Paper>
    );
}
