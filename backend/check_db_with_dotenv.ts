import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('DATABASE_URL:', process.env.DATABASE_URL);
        const count = await prisma.carrera.count();
        console.log(`✅ Conexión exitosa a la base de datos!`);
        console.log(`Carreras count: ${count}`);
        if (count > 0) {
            const first = await prisma.carrera.findFirst({ include: { facultad: true } });
            console.log('First carrera:', first);
        }
    } catch (error) {
        console.error('❌ Error al conectar:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
