import { apiClient } from './api';
import type { Team } from '../types';

export type { Team };

export interface CreateTeamRequest {
    nombre: string;
    logoUrl?: string;
    facultad?: string;
    disciplina?: string;
    capitanId?: number;
    codigoAcceso?: string;
}

export const teamsService = {
    async getAll(): Promise<Team[]> {
        const response = await apiClient.get('/equipos');
        return response.data;
    },

    async getById(id: number): Promise<Team> {
        const response = await apiClient.get(`/equipos/${id}`);
        return response.data;
    },

    async create(data: CreateTeamRequest): Promise<Team> {
        const response = await apiClient.post('/equipos', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreateTeamRequest>): Promise<Team> {
        const response = await apiClient.put(`/equipos/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/equipos/${id}`);
    },

    async getUserTeams(): Promise<Team[]> {
        const response = await apiClient.get('/equipos/mis-equipos');
        return response.data;
    },

    async getAvailableTeams(): Promise<Team[]> {
        const response = await apiClient.get('/equipos/disponibles');
        return response.data;
    },

    async joinTeam(id: number, codigoAcceso?: string): Promise<void> {
        await apiClient.post(`/equipos/${id}/join`, { codigoAcceso });
    },

    async leaveTeam(id: number): Promise<void> {
        await apiClient.post(`/equipos/${id}/leave`);
    }
};
