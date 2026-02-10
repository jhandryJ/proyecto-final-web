import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTorneo() {
    const torneo = await prisma.torneo.findUnique({
        where: { id: 6 },
        select: {
            id: true,
            categoria: true,
            tipoSorteo: true,
            campeonato: {
                select: { nombre: true }
            }
        }
    });

    console.log('\n=== TORNEO ID 6 ===');
    console.log(JSON.stringify(torneo, null, 2));
    console.log('\n');

    await prisma.$disconnect();
}

checkTorneo().catch(console.error);
