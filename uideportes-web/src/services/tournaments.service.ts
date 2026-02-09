import { apiClient } from './api';

export interface Campeonato {
    id: number;
    nombre: string;
    anio: number;
    fechaInicio: string;
    fechaFin?: string;
    torneos?: Torneo[];
}

export interface Torneo {
    id: number;
    campeonatoId: number;
    disciplina: string;
    categoria: string;
    genero?: string;
    tipoSorteo?: string;
    configuracion?: any;
    inscripciones?: any[];
    costoInscripcion?: number;
}

export interface CreateCampeonatoRequest {
    nombre: string;
    anio: number;
    fechaInicio: string;
    fechaFin?: string;
}

export interface CreateTorneoRequest {
    campeonatoId: number;
    disciplina: string;
    categoria: string;
    genero?: string;
    costoInscripcion?: number;
}

export interface GenerateDrawRequest {
    type: 'BRACKET' | 'GRUPOS';
    settings?: {
        groupsCount?: number;
    };
}

export const tournamentsService = {
    async getCampeonatos(): Promise<Campeonato[]> {
        const response = await apiClient.get('/campeonatos');
        return response.data;
    },

    async createCampeonato(data: CreateCampeonatoRequest): Promise<Campeonato> {
        const response = await apiClient.post('/campeonatos', data);
        return response.data;
    },

    async deleteCampeonato(id: number): Promise<void> {
        await apiClient.delete(`/campeonatos/${id}`);
    },

    async createTorneo(data: CreateTorneoRequest): Promise<Torneo> {
        const response = await apiClient.post('/torneos', data);
        return response.data;
    },

    async deleteTorneo(id: number): Promise<void> {
        await apiClient.delete(`/torneos/${id}`);
    },

    async generateDraw(torneoId: number, data: GenerateDrawRequest): Promise<{ message: string; matchesCreated: number }> {
        const response = await apiClient.post(`/torneos/${torneoId}/sorteo`, data);
        return response.data;
    },

    async updateCampeonato(id: number, data: Partial<CreateCampeonatoRequest>): Promise<Campeonato> {
        const response = await apiClient.put(`/campeonatos/${id}`, data);
        return response.data;
    },

    async updateTorneo(id: number, data: Partial<CreateTorneoRequest>): Promise<Torneo> {
        const response = await apiClient.put(`/torneos/${id}`, data);
        return response.data;
    },

    async registerTeam(torneoId: number, equipoId: number): Promise<any> {
        const response = await apiClient.post(`/torneos/${torneoId}/inscripciones`, { equipoId });
        return response.data;
    },

    async promoteToKnockout(torneoId: number): Promise<any> {
        const response = await apiClient.post(`/torneos/${torneoId}/promover`, {});
        return response.data;
    }
};
