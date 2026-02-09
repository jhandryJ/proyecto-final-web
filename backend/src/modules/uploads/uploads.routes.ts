import { FastifyInstance } from 'fastify';
import { uploadHandler } from './uploads.controller.js';

export async function uploadRoutes(app: FastifyInstance) {
    app.post('/uploads', {}, uploadHandler);
}
