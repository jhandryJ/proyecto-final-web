import { prisma } from '../utils/prisma.js';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * Crea una notificación para un usuario
 */
export async function createNotification(
    usuarioId: number,
    mensaje: string,
    tipo: NotificationType = 'INFO',
    link?: string
) {
    try {
        return await prisma.notificacion.create({
            data: {
                usuarioId,
                mensaje,
                tipo,
                link
            }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        // No lanzamos error para no interrumpir el flujo principal
        return null;
    }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getUserNotifications(usuarioId: number, limit = 20) {
    return await prisma.notificacion.findMany({
        where: { usuarioId },
        orderBy: { fecha: 'desc' },
        take: limit
    });
}

/**
 * Marca como leída una notificación
 */
export async function markAsRead(id: number, usuarioId: number) {
    // Verificar que pertenezca al usuario
    const notification = await prisma.notificacion.findFirst({
        where: { id, usuarioId }
    });

    if (!notification) return null;

    return await prisma.notificacion.update({
        where: { id },
        data: { leida: true }
    });
}

/**
 * Marca todas como leídas
 */
export async function markAllAsRead(usuarioId: number) {
    return await prisma.notificacion.updateMany({
        where: { usuarioId, leida: false },
        data: { leida: true }
    });
}
