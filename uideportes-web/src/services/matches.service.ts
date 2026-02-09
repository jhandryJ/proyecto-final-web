import { apiClient } from './api';

export interface Partido {
    id: number;
    torneoId: number;
    equipoLocalId?: number;
    equipoVisitanteId?: number;
    fechaHora: string;
    estado: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';
    marcadorLocal?: number;
    marcadorVisitante?: number;
    fase?: string;
    llave?: string;
    equipoLocal?: {
        id: number;
        nombre: string;
        logoUrl?: string;
    };
    equipoVisitante?: {
        id: number;
        nombre: string;
        logoUrl?: string;
    };
    cancha?: {
        nombre: string;
    };
    arbitro?: {
        nombres: string;
    };
}

export interface UpdateMatchResultRequest {
    marcadorLocal: number;
    marcadorVisitante: number;
    estado?: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';
}

export const matchesService = {
    async getByTournament(torneoId: number): Promise<Partido[]> {
        const response = await apiClient.get(`/torneos/${torneoId}/partidos`);
        return response.data;
    },

    async updateResult(id: number, data: { marcadorLocal?: number, marcadorVisitante?: number, estado?: string, fechaHora?: Date, canchaId?: number }): Promise<Partido> {
        const response = await apiClient.patch(`/partidos/${id}/resultado`, data);
        return response.data;
    },

    async getNextMatch(): Promise<Partido | null> {
        const response = await apiClient.get('/next-match');
        return response.data;
    },
};
