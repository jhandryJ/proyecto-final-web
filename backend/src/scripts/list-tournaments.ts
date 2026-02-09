import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTournaments() {
    const torneos = await prisma.torneo.findMany({
        include: {
            campeonato: true,
            equiposInscritos: {
                include: {
                    equipo: true
                }
            }
        }
    });

    console.log('\n=== TORNEOS EN LA BASE DE DATOS ===\n');

    for (const torneo of (torneos as any)) {
        console.log(`ID: ${torneo.id}`);
        console.log(`Campeonato: ${torneo.campeonato.nombre}`);
        console.log(`Disciplina: ${torneo.disciplina}`);
        console.log(`Categoría: ${torneo.categoria}`);
        console.log(`Género: ${torneo.genero}`);
        console.log(`Tipo Sorteo: ${torneo.tipoSorteo}`);
        console.log(`Equipos inscritos: ${torneo.equiposInscritos.length}`);
        if (torneo.equiposInscritos.length > 0) {
            console.log('Equipos:');
            torneo.equiposInscritos.forEach((i: any) => {
                console.log(`  - ${i.equipo.nombre} (${i.estado})`);
            });
        }
        console.log('---\n');
    }

    await prisma.$disconnect();
}

listTournaments().catch(console.error);
