import { FastifyInstance } from 'fastify';
import { getNotificationsHandler, markNotificationReadHandler, markAllNotificationsReadHandler } from './notifications.controller.js';

export async function notificationRoutes(app: FastifyInstance) {
    app.get('/', {
        preHandler: [app.authenticate]
    }, getNotificationsHandler);

    app.put('/:id/leida', {
        preHandler: [app.authenticate]
    }, markNotificationReadHandler);

    app.put('/leida-todas', {
        preHandler: [app.authenticate]
    }, markAllNotificationsReadHandler);
}
