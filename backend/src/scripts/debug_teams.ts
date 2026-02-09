
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking tournaments and teams...');
    const torneos = await prisma.torneo.findMany({
        include: {
            equiposInscritos: {
                include: { equipo: true }
            },
            campeonato: true
        }
    });

    if (torneos.length === 0) {
        console.log('No tournaments found.');
    } else {
        torneos.forEach((t: any) => {
            console.log(`Tournament ID: ${t.id} - ${t.campeonato.nombre} (${t.categoria} ${t.disciplina})`);
            console.log(`  Teams Count: ${t.equiposInscritos.length}`);
            t.equiposInscritos.forEach((i: any) => {
                console.log(`    - Team: ${i.equipo.nombre} (Status: ${i.estado})`);
            });
        });
    }

    const teams = await prisma.equipo.findMany();
    console.log('\nAvailable Teams:');
    teams.forEach(t => console.log(`ID: ${t.id} - ${t.nombre} (${t.disciplina})`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
