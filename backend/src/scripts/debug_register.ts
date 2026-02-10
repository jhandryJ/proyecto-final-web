
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Force Registering Teams ---');

    console.log('1. Finding tournament...');
    // Try to find the one with "vommebol"
    let tournament = await prisma.torneo.findFirst({
        where: {
            campeonato: {
                nombre: { contains: 'vommebol' }
            }
        },
        include: { campeonato: true },
        orderBy: { id: 'desc' }
    });

    if (!tournament) {
        console.log('Target tournament not found. Picking latest one.');
        tournament = await prisma.torneo.findFirst({
            include: { campeonato: true },
            orderBy: { id: 'desc' }
        });
    }

    if (!tournament) {
        console.log('No tournaments found.');
        return;
    }
    console.log(`Target Tournament: ${tournament.id} - ${tournament.campeonato.nombre} / ${tournament.disciplina}`);

    console.log('2. Fetching all teams...');
    const teams = await prisma.equipo.findMany();
    console.log(`Found ${teams.length} teams.`);

    console.log('3. Registering teams...');
    let successCount = 0;
    for (const team of teams) {
        const existing = await prisma.equipotorneo.findUnique({
            where: {
                equipoId_torneoId: {
                    equipoId: team.id,
                    torneoId: tournament.id
                }
            }
        });

        if (!existing) {
            try {
                await prisma.equipotorneo.create({
                    data: {
                        equipoId: team.id,
                        torneoId: tournament.id,
                        estado: 'ACEPTADO'
                    }
                });
                successCount++;
            } catch (e) {
                console.error(`Error registering team ${team.id}`, e);
            }
        } else {
            // Ensure it is accepted
            if (existing.estado !== 'ACEPTADO') {
                await prisma.equipotorneo.update({
                    where: { id: existing.id },
                    data: { estado: 'ACEPTADO' }
                });
                successCount++;
            }
        }
    }

    console.log(`Registered/Updated ${successCount} teams.`);

    const count = await prisma.equipotorneo.count({
        where: { torneoId: tournament.id }
    });
    console.log(`Total enrolled: ${count}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
