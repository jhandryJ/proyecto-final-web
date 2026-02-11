import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../utils/prisma.js';
import { createArbitroSchema, createCanchaSchema } from './resources.schemas.js';
import { z } from 'zod';

// --- Árbitros Handlers ---

export async function createArbitroHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createArbitroSchema> }>,
    reply: FastifyReply
) {
    const { nombres, contacto } = request.body;

    try {
        const arbitro = await prisma.arbitro.create({
            data: { nombres, contacto }
        });
        return reply.status(201).send(arbitro);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error creating arbiter' });
    }
}

export async function getArbitrosHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const arbitros = await prisma.arbitro.findMany();
        return reply.status(200).send(arbitros);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching arbiters' });
    }
}

// --- Canchas Handlers ---

export async function createCanchaHandler(
    request: FastifyRequest<{ Body: z.infer<typeof createCanchaSchema> }>,
    reply: FastifyReply
) {
    const { nombre, ubicacion } = request.body;

    try {
        const cancha = await prisma.cancha.create({
            data: { nombre, ubicacion }
        });
        return reply.status(201).send(cancha);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error creating pitch' });
    }
}

export async function getCanchasHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const canchas = await prisma.cancha.findMany();
        return reply.status(200).send(canchas);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching pitches' });
    }
}

// --- Facultades Handlers ---

export async function getFacultiesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const facultades = await prisma.facultad.findMany({
            include: {
                carreras: {
                    select: {
                        id: true,
                        nombre: true,
                        facultadId: true
                    },
                    orderBy: {
                        nombre: 'asc'
                    }
                }
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        return reply.status(200).send(facultades);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching faculties' });
    }
}

// --- Carreras Handlers ---

export async function getCareersHandler(
    request: FastifyRequest<{ Querystring: { facultadId?: string } }>,
    reply: FastifyReply
) {
    const { facultadId } = request.query;

    try {
        const where = facultadId ? { facultadId: parseInt(facultadId) } : {};
        const carreras = await prisma.carrera.findMany({
            where,
            include: {
                facultad: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        return reply.status(200).send(carreras);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error fetching careers' });
    }
}
