import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirigir al nuevo flujo unificado de recuperación por código
        navigate('/forgot-password', { replace: true });
    }, [navigate]);

    return null;
};
