import { FastifyInstance } from 'fastify';
import { getNotificationsHandler, markNotificationReadHandler, markAllNotificationsReadHandler, deleteNotificationHandler } from './notifications.controller.js';

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

    app.delete('/:id', {
        preHandler: [app.authenticate]
    }, deleteNotificationHandler);
}
