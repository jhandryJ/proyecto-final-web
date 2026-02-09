import { apiClient } from './api';
import type { Feedback, TipoFeedback } from '../types';

export interface CreateFeedbackRequest {
    mensaje: string;
    tipo: TipoFeedback | string;
}

export const feedbackService = {
    async getAll(): Promise<Feedback[]> {
        const response = await apiClient.get('/feedback');
        return response.data;
    },

    async getMyFeedback(): Promise<Feedback[]> {
        const response = await apiClient.get('/feedback/mis-reportes');
        return response.data;
    },

    async create(data: CreateFeedbackRequest): Promise<Feedback> {
        const response = await apiClient.post('/feedback', data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/feedback/${id}`);
    },
};
