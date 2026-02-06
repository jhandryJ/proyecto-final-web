import api from './api';

export interface Team {
    id: number;
    nombre: string;
    logoUrl?: string;
    facultad?: string;
    capitanId: number;
    capitan?: {
        nombres: string;
        apellidos: string;
    };
}


export interface CreateTeamDto {
    nombre: string;
    facultad?: string;
    logoUrl?: string;
    capitanId?: number;
    miembros?: {
        usuarioId: number;
        dorsal?: string;
        posicion?: string;
    }[];
}

export const teamService = {
    getAll: async () => {
        const response = await api.get('/equipos');
        // Map backend (Spanish) to frontend (English)
        return response.data.map((team: any) => ({
            id: team.id.toString(),
            name: team.nombre,
            sport: team.facultad || 'General', // Fallback
            color: team.logoUrl && team.logoUrl.startsWith('#') ? team.logoUrl : '#3B82F6', // Use logoUrl, default to blue
            players: [], // Backend doesn't return players yet
            createdAt: new Date(), // Missing in backend response
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0
        }));
    },

    create: async (data: CreateTeamDto) => {
        const response = await api.post('/equipos', data);
        return response.data;
    },

    getMyTeam: async () => {
        // Backend doesn't support /my-team yet, so we'll fetch all and filter client-side until implemented
        // Or specific logic if needed
        const response = await api.get('/equipos');
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/equipos/${id}`);
        return response.data;
    }
};
