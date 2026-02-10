import { apiClient } from './api';
import type { EquipoTorneo } from '../types';

export interface EnrollTeamRequest {
    equipoId: number;
    torneoId: number;
}

export interface UpdateEnrollmentRequest {
    estado: 'INSCRITO' | 'ACEPTADO';
}

export const enrollmentsService = {
    async getAll(): Promise<EquipoTorneo[]> {
        const response = await apiClient.get('/inscripciones');
        return response.data;
    },

    async getByTournament(torneoId: number): Promise<EquipoTorneo[]> {
        const response = await apiClient.get(`/inscripciones/torneo/${torneoId}`);
        return response.data;
    },

    async getByTeam(equipoId: number): Promise<EquipoTorneo[]> {
        const response = await apiClient.get(`/inscripciones/equipo/${equipoId}`);
        return response.data;
    },

    async enroll(data: EnrollTeamRequest): Promise<EquipoTorneo> {
        const response = await apiClient.post('/inscripciones', data);
        return response.data;
    },

    async updateStatus(id: number, data: UpdateEnrollmentRequest): Promise<EquipoTorneo> {
        const response = await apiClient.put(`/inscripciones/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/inscripciones/${id}`);
    },
};
