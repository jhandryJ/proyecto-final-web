import { apiClient } from './api';
import type { ValidacionPago, EstadoPago } from '../types';

export interface CreatePaymentRequest {
    equipoId: number;
    torneoId: number;
    monto: number;
    comprobanteUrl: string;
    observacion?: string;
}

export interface ValidatePaymentRequest {
    estado: EstadoPago;
    observacion?: string;
}

export const paymentsService = {
    async getAll(): Promise<ValidacionPago[]> {
        const response = await apiClient.get('/pagos');
        return response.data;
    },

    async getByTeam(equipoId: number): Promise<ValidacionPago[]> {
        const response = await apiClient.get(`/pagos/equipo/${equipoId}`);
        return response.data;
    },

    async getPending(): Promise<ValidacionPago[]> {
        const response = await apiClient.get('/pagos/pendientes');
        return response.data;
    },

    async create(data: CreatePaymentRequest): Promise<ValidacionPago> {
        const response = await apiClient.post('/pagos', data);
        return response.data;
    },

    async validate(id: number, data: ValidatePaymentRequest): Promise<ValidacionPago> {
        const response = await apiClient.patch(`/pagos/${id}/validar`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/pagos/${id}`);
    },
};
