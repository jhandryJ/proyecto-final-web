import { apiClient } from './api';
import type { Cancha, Arbitro, Facultad, Carrera } from '../types';

export interface CreateCanchaRequest {
    nombre: string;
    ubicacion?: string;
}

export interface CreateArbitroRequest {
    nombres: string;
    contacto?: string;
}

export const resourcesService = {
    // Canchas
    async getAllCanchas(): Promise<Cancha[]> {
        const response = await apiClient.get('/canchas');
        return response.data;
    },

    async getCanchaById(id: number): Promise<Cancha> {
        const response = await apiClient.get(`/canchas/${id}`);
        return response.data;
    },

    async createCancha(data: CreateCanchaRequest): Promise<Cancha> {
        const response = await apiClient.post('/canchas', data);
        return response.data;
    },

    async updateCancha(id: number, data: Partial<CreateCanchaRequest>): Promise<Cancha> {
        const response = await apiClient.put(`/canchas/${id}`, data);
        return response.data;
    },

    async deleteCancha(id: number): Promise<void> {
        await apiClient.delete(`/canchas/${id}`);
    },

    // Árbitros
    async getAllArbitros(): Promise<Arbitro[]> {
        const response = await apiClient.get('/arbitros');
        return response.data;
    },

    async getArbitroById(id: number): Promise<Arbitro> {
        const response = await apiClient.get(`/arbitros/${id}`);
        return response.data;
    },

    async createArbitro(data: CreateArbitroRequest): Promise<Arbitro> {
        const response = await apiClient.post('/arbitros', data);
        return response.data;
    },

    async updateArbitro(id: number, data: Partial<CreateArbitroRequest>): Promise<Arbitro> {
        const response = await apiClient.put(`/arbitros/${id}`, data);
        return response.data;
    },

    async deleteArbitro(id: number): Promise<void> {
        await apiClient.delete(`/arbitros/${id}`);
    },

    // Facultades y Carreras
    async getFaculties(): Promise<Facultad[]> {
        const response = await apiClient.get('/facultades');
        return response.data;
    },

    async getCareers(facultadId?: number): Promise<Carrera[]> {
        const params = facultadId ? { facultadId: String(facultadId) } : {};
        const response = await apiClient.get('/carreras', { params });
        return response.data;
    },
};
