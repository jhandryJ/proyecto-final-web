import { apiClient } from './api';
import type { Facultad, Carrera } from '../types';

export const facultiesService = {
    /**
     * Obtiene todas las facultades con sus carreras
     */
    getAllFaculties: async (): Promise<(Facultad & { carreras: Carrera[] })[]> => {
        const response = await apiClient.get('/api/resources/facultades');
        return response.data;
    },

    /**
     * Obtiene las carreras por ID de facultad
     */
    getCareersByFaculty: async (facultadId: number): Promise<Carrera[]> => {
        const response = await apiClient.get('/api/resources/carreras', {
            params: { facultadId: facultadId.toString() }
        });
        return response.data;
    },

    /**
     * Obtiene todas las carreras
     */
    getAllCareers: async (): Promise<Carrera[]> => {
        const response = await apiClient.get('/api/resources/carreras');
        return response.data;
    },
};
