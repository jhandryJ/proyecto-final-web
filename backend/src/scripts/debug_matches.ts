
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching tournaments and matches...');

    const tournaments = await prisma.torneo.findMany({
        include: {
            campeonato: true,
            partidos: true,
            equiposInscritos: {
                include: { equipo: true }
            }
        }
    });

    console.log(`Found ${tournaments.length} tournaments.`);

    for (const t of tournaments) {
        console.log(`\nTournament ID: ${t.id} - ${t.campeonato.nombre} (${t.disciplina} ${t.genero} ${t.categoria})`);
        console.log(`Teams enrolled: ${t.equiposInscritos.length}`);
        console.log(`Tipo Sorteo: ${t.tipoSorteo}`);
        console.log(`Matches count: ${t.partidos.length}`);

        if (t.partidos.length > 0) {
            console.log('First 3 matches:');
            t.partidos.slice(0, 3).forEach(m => {
                console.log(` - ID: ${m.id}, Phase: ${m.fase}, Local: ${m.equipoLocalId}, Visitor: ${m.equipoVisitanteId}, State: ${m.estado}`);
            });
        } else {
            console.log('No matches found.');
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
