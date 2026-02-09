import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type RegisterRequest } from '../services/auth.service';

import { type Carrera } from '../types';

export interface User {
    id: number;
    cedula: string;
    email: string;
    nombres: string;
    apellidos: string;
    rol: string;
    genero?: string;
    createdAt: string;
    carrera?: Carrera;
    chatBannedUntil?: string;
    chatBanReason?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Cargar datos del localStorage o sessionStorage al iniciar
        const storedToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, rememberMe: boolean = false) => {
        const response = await authService.login({ email, password });
        setToken(response.accessToken);
        setUser(response.user);

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', response.accessToken);
        storage.setItem('user', JSON.stringify(response.user));

        // Limpiar el otro por si acaso
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem('accessToken');
        otherStorage.removeItem('user');

        return response.user;
    };

    const register = async (data: RegisterRequest) => {
        const response = await authService.register(data);
        setToken(response.accessToken);
        setUser(response.user);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                isAuthenticated: !!token,
                isAdmin: user?.rol === 'ADMIN',
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
