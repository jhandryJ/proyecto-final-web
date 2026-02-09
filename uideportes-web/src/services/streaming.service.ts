import { apiClient } from './api';
import type { StreamEvent } from '../types';

export const streamingService = {
    async getStreams(): Promise<StreamEvent[]> {
        const response = await apiClient.get('/streaming');
        // Map dates from string to Date objects
        return response.data.map((s: any) => ({
            ...s,
            scheduledDate: new Date(s.scheduledDate),
            matchup: {
                ...s.matchup,
                date: new Date(s.matchup.date)
            }
        }));
    },

    async createStream(data: { partidoId: number; url: string; isLive?: boolean }) {
        const response = await apiClient.post('/streaming', data);
        return response.data;
    },

    async deleteStream(id: number) {
        await apiClient.delete(`/streaming/${id}`);
    },

    async updateStreamStatus(id: number, isLive: boolean) {
        const response = await apiClient.patch(`/streaming/${id}`, { isLive });
        return response.data;
    },

    async likeStream(id: number) {
        const response = await apiClient.patch(`/streaming/${id}/like`);
        return response.data;
    },

    async getChatHistory(sala: string) {
        const response = await apiClient.get(`/streaming/chat/${sala}`);
        return response.data;
    }
};
