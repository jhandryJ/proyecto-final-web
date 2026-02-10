import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Faculties and Careers ---');
    const faculties = await prisma.facultad.findMany({
        include: {
            carreras: true
        }
    });

    for (const fac of faculties) {
        console.log(`Facultad: ${fac.nombre} (${fac.carreras.length} carreras)`);
        for (const car of fac.carreras) {
            console.log(`  - ${car.nombre}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
