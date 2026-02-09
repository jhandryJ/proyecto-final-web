import { apiClient } from './api';

export interface Usuario {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    rol: 'ADMIN' | 'CAPITAN' | 'ESTUDIANTE';
    facultad?: string;
    carrera?: string;
}

export const usersService = {
    async getAll(): Promise<Usuario[]> {
        const response = await apiClient.get('/usuarios');
        return response.data;
    },

    async getById(id: number): Promise<Usuario> {
        const response = await apiClient.get(`/usuarios/${id}`);
        return response.data;
    },
};
