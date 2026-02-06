import api from './api';

export interface LoginResponse {
    accessToken: string;
    user: {
        id: number;
        email: string;
        nombres: string;
        apellidos: string;
        rol: string;
    };
}

export interface RegisterData {
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    facultad?: string;
    carrera?: string;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', { email, password });
        if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getAllUsers: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    }
};
