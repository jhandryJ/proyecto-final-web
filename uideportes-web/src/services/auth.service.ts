import { apiClient } from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    rol?: 'ADMIN' | 'CAPITAN' | 'ESTUDIANTE';
    carreraId: number;
    genero?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: {
        id: number;
        cedula: string;
        email: string;
        nombres: string;
        apellidos: string;
        rol: string;
        genero?: string;
        createdAt: string;
        carrera?: any;
    };
}

export const authService = {
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/login', data);
        return response.data;
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
    },

    async promoteToCaptain(): Promise<AuthResponse & { message: string }> {
        const response = await apiClient.post('/auth/promote-captain');
        return response.data;
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(data: any): Promise<{ message: string }> {
        const response = await apiClient.post('/auth/reset-password', data);
        return response.data;
    }
};
