import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sendTournamentInscriptionEmail } from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';
import { prisma } from '../../utils/prisma.js';
import { createEnrollmentSchema, updateEnrollmentStatusSchema } from './enrollments.schemas.js';

export async function enrollTeamHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createEnrollmentSchema> }>,
    reply: FastifyReply
) {
    try {
        const { equipoId, torneoId } = request.body;
        const user = request.user;

        // Validation: Verify if the user is the captain of the team provided
        const team = await prisma.equipo.findUnique({
            where: { id: equipoId },
            include: { capitan: true }
        });

        if (!team) {
            return reply.code(404).send({ message: 'Team not found' });
        }

        if (team.capitanId !== user.id && user.rol !== 'ADMIN') {
            return reply.code(403).send({ message: 'Only the captain can enroll the team' });
        }

        // Check if tournament exists
        const tournament = await prisma.torneo.findUnique({ where: { id: torneoId } });
        if (!tournament) {
            return reply.code(404).send({ message: 'Tournament not found' });
        }

        const enrollment = await prisma.equipotorneo.create({
            data: {
                equipoId,
                torneoId,
                estado: 'INSCRITO'
            }
        });

        // Send Email and Notification
        if (team.capitan) {
            const tournamentName = `${tournament.disciplina} ${tournament.categoria}`;

            sendTournamentInscriptionEmail(
                team.nombre,
                tournamentName,
                team.capitan.email
            ).catch(console.error);

            createNotification(
                team.capitanId,
                `Tu equipo "${team.nombre}" se ha inscrito en el torneo "${tournamentName}".`,
                'INFO'
            ).catch(console.error);
        }

        return reply.code(201).send(enrollment);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return reply.code(409).send({ message: 'Team is already enrolled in this tournament' });
        }
        return reply.code(500).send({ message: 'Error enrolling team' });
    }
}

export async function updateEnrollmentStatusHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof updateEnrollmentStatusSchema> }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { estado } = request.body;

    // Middleware already verifies ADMIN role for this route

    try {
        const enrollment = await prisma.equipotorneo.update({
            where: { id: Number(id) },
            data: { estado }
        });
        return reply.send(enrollment);
    } catch (e) {
        return reply.code(500).send({ message: 'Error updating enrollment status' });
    }
}

export async function getEnrollmentsHandler(
    request: FastifyRequest<{ Querystring: { torneoId?: string, equipoId?: string } }>,
    reply: FastifyReply
) {
    const { torneoId, equipoId } = request.query;

    const whereClause: any = {};
    if (torneoId) whereClause.torneoId = Number(torneoId);
    if (equipoId) whereClause.equipoId = Number(equipoId);

    const enrollments = await prisma.equipotorneo.findMany({
        where: whereClause,
        include: {
            equipo: { select: { nombre: true } },
            torneo: { select: { disciplina: true, categoria: true } }
        }
    });

    return reply.send(enrollments);
}
