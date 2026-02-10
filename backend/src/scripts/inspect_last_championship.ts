
import { prisma } from '../utils/prisma.js';

async function main() {
    console.log('Inspecting last created championship...');
    const lastChampionship = await prisma.campeonato.findFirst({
        orderBy: { id: 'desc' },
        include: {
            torneos: true
        }
    });

    if (!lastChampionship) {
        console.log('No championships found.');
    } else {
        console.log('Last Championship:', lastChampionship.nombre);
        console.log('ID:', lastChampionship.id);
        console.log('Created Tournaments associated:', lastChampionship.torneos.length);
        lastChampionship.torneos.forEach((t, i) => {
            console.log(`  Tournament ${i + 1}: ${t.disciplina} - ${t.categoria} - ${t.genero} (ID: ${t.id})`);
        });
    }

    await prisma.$disconnect();
}

main();
