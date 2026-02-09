
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.carrera.count();
    console.log(`Carreras count: ${count}`);
    if (count > 0) {
        const first = await prisma.carrera.findFirst({ include: { facultad: true } });
        console.log('First carrera:', first);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
