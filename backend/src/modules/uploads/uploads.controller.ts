import { FastifyReply, FastifyRequest } from 'fastify';
import { pipeline } from 'stream';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pump = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define uploads directory relative to project root
// Assuming current file is in src/modules/uploads
// We want backend/public/uploads
const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function uploadHandler(req: FastifyRequest, reply: FastifyReply) {
    try {
        const data = await req.file();

        if (!data) {
            return reply.code(400).send({ message: 'No file uploaded' });
        }

        const fileExtension = path.extname(data.filename);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = path.join(UPLOADS_DIR, fileName);

        await pump(data.file, fs.createWriteStream(filePath));

        // Construct public URL
        const fileUrl = `/uploads/${fileName}`;

        return reply.send({ url: fileUrl });
    } catch (err: any) {
        req.log.error(err);
        return reply.code(500).send({
            message: 'Internal Server Error',
            error: err.message || 'Unknown error',

        });
    }
}
