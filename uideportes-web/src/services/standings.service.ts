import { apiClient } from './api';

export interface TeamStanding {
    equipoId: number;
    equipoNombre: string;
    logoUrl?: string;
    partidosJugados: number;
    ganados: number;
    empatados: number;
    perdidos: number;
    golesFavor: number;
    golesContra: number;
    diferencia: number;
    puntos: number;
    grupo?: string;
}

export interface TournamentStandings {
    torneoId: number;
    torneoNombre: string;
    tipoSorteo: string;
    equipos: TeamStanding[];
    grupos?: { [key: string]: TeamStanding[] };
}

export const standingsService = {
    async getByTournament(torneoId: number): Promise<TournamentStandings> {
        // Add timestamp to prevent caching
        const response = await apiClient.get(`/torneos/${torneoId}/posiciones?_t=${Date.now()}`);
        return response.data;
    },

    async getTeamStats(equipoId: number, torneoId: number): Promise<TeamStanding> {
        const response = await apiClient.get(`/equipos/${equipoId}/estadisticas/${torneoId}`);
        return response.data;
    },
};
