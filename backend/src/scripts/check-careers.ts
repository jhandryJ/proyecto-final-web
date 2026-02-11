import { prisma } from '../utils/prisma.js';

async function main() {
    try {
        console.log('Checking careers in database...');
        const facultyCount = await prisma.facultad.count();
        const careerCount = await prisma.carrera.count();
        console.log(`Faculties found: ${facultyCount}`);
        console.log(`Careers found: ${careerCount}`);

        if (careerCount > 0) {
            const careers = await prisma.carrera.findMany({ take: 5 });
            console.log('Sample careers:', careers);
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
