import { FastifyReply, FastifyRequest } from 'fastify';
import { streamingService } from './streaming.service.js';

export async function getStreamsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const streams = await streamingService.getStreams();
        return reply.send(streams);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error fetching streams' });
    }
}

export async function createStreamHandler(
    request: FastifyRequest<{ Body: { partidoId: number; url: string; isLive: boolean } }>,
    reply: FastifyReply
) {
    try {
        const stream = await streamingService.createStream(request.body);
        return reply.code(201).send(stream);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error creating stream' });
    }
}

export async function deleteStreamHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        await streamingService.deleteStream(parseInt(request.params.id));
        return reply.code(204).send();
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error deleting stream' });
    }
}

export async function getChatHistoryHandler(
    request: FastifyRequest<{ Params: { sala: string } }>,
    reply: FastifyReply
) {
    try {
        const history = await streamingService.getChatHistory(request.params.sala);
        return reply.send(history);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error fetching chat history' });
    }
}

export async function likeStreamHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const updated = await streamingService.likeStream(parseInt(request.params.id));
        return reply.send(updated);
    } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ message: 'Error liking stream' });
    }
}
