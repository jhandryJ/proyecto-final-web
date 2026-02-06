import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export function StatsCard({ title, value, icon: Icon, color = 'primary' }: StatsCardProps) {

    return (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: `${color}.main`,
                            width: 64,
                            height: 64,
                        }}
                    >
                        <Icon size={32} color="white" />
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
}
