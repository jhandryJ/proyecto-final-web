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
        console.error('Error al crear notificación:', error);
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

/**
 * Elimina una notificación
 */
export async function deleteNotification(id: number, usuarioId: number) {
    const notification = await prisma.notificacion.findFirst({
        where: { id, usuarioId }
    });

    if (!notification) return null;

    return await prisma.notificacion.delete({
        where: { id }
    });
}

/**
 * Notifica a todos los administradores
 */
export async function notifyAdmins(mensaje: string, tipo: NotificationType = 'INFO', link?: string) {
    try {
        const admins = await prisma.usuario.findMany({
            where: { rol: 'ADMIN' },
            select: { id: true }
        });

        if (admins.length === 0) return;

        // Crear notificaciones en lote
        await prisma.notificacion.createMany({
            data: admins.map(admin => ({
                usuarioId: admin.id,
                mensaje,
                tipo,
                link,
                fecha: new Date(),
                leida: false
            }))
        });
    } catch (error) {
        console.error('Error al notificar administradores:', error);
    }
}
