import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserNotifications, markAsRead, markAllAsRead } from '../../services/notification.service.js';

export async function getNotificationsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = request.user as { id: number };
    const notifications = await getUserNotifications(user.id);
    return reply.send(notifications);
}

export async function markNotificationReadHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const user = request.user as { id: number };

    const result = await markAsRead(Number(id), user.id);

    if (!result) {
        return reply.code(404).send({ message: 'Notificación no encontrada' });
    }

    return reply.send(result);
}

export async function markAllNotificationsReadHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = request.user as { id: number };
    await markAllAsRead(user.id);
    return reply.code(204).send();
}
