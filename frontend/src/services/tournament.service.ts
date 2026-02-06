import api from './api';

export interface Tournament {
    id: number;
    campeonatoId: number;
    disciplina: string;
    categoria: string;
    genero?: string;
    campeonato?: {
        nombre: string;
        anio: number;
        fechaInicio: string;
        fechaFin?: string;
    };
}

export const tournamentService = {
    getAll: async () => {
        const response = await api.get('/campeonatos');
        // Map backend (Spanish) to frontend (English)
        return response.data.map((camp: any) => ({
            id: camp.id.toString(),
            name: camp.nombre,
            sport: camp.torneos && camp.torneos.length > 0 ? camp.torneos[0].disciplina : 'Multi-deporte',
            format: camp.torneos && camp.torneos.length > 0 ? camp.torneos[0].categoria : 'knockout',
            teams: [], // Info not in simple championship list
            status: 'pending',
            createdAt: new Date(camp.fechaInicio),
            image: ''
        }));
    },

    getById: async (id: number) => {
        const response = await api.get(`/campeonatos/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        // 1. Create Championship
        const campResponse = await api.post('/campeonatos', {
            nombre: data.name,
            anio: new Date().getFullYear(),
            fechaInicio: new Date()
        });
        const campeonatoId = campResponse.data.id;

        // 2. Create Tournament (Torneo)
        // Map frontend values to backend ENUMS
        const sportMap: Record<string, string> = {
            'Fútbol': 'FUTBOL',
            'Baloncesto': 'BASKET',
            'Ecuavoley': 'ECUAVOLEY',
            'Voleibol': 'ECUAVOLEY' // Fallback/Map
        };
        const formatMap: Record<string, string> = {
            'knockout': 'ELIMINATORIA',
            'groups': 'FASE_GRUPOS',
            'single-elimination': 'ELIMINATORIA'
        };

        const torneoResponse = await api.post('/torneos', {
            campeonatoId,
            disciplina: sportMap[data.sport] || 'FUTBOL',
            categoria: formatMap[data.format] || 'ELIMINATORIA',
            genero: 'MIXTO' // Default
        });
        const torneoId = torneoResponse.data.id;

        // 3. Enroll Teams
        if (data.teams && data.teams.length > 0) {
            // data.teams are IDs (strings)
            const enrollmentPromises = data.teams.map((teamId: string) =>
                api.post('/inscripciones', {
                    torneoId,
                    equipoId: parseInt(teamId)
                })
            );
            await Promise.all(enrollmentPromises);
        }

        return campResponse.data;
    },

    // Helper para obtener campeonatos, ya que los torneos dependen de ellos
    getCampeonatos: async () => {
        const response = await api.get('/campeonatos'); // Asumiendo que existe esta ruta
        return response.data;
    }
};
