import { prisma } from '../utils/prisma.js';

async function seedStream() {
    console.log('Seeding stream data...');
    
    // Find a match or create one
    let match = await prisma.partido.findFirst();
    if (!match) {
        // Find a tournament
        const tournament = await prisma.torneo.findFirst();
        if (!tournament) {
            console.log('No tournament found. Skipping stream seed.');
            return;
        }
        
        // Find or create teams
        const teams = await prisma.equipo.findMany({ take: 2 });
        if (teams.length < 2) {
             console.log('Not enough teams. Skipping stream seed.');
             return;
        }

        match = await prisma.partido.create({
            data: {
                torneoId: tournament.id,
                equipoLocalId: teams[0].id,
                equipoVisitanteId: teams[1].id,
                fechaHora: new Date(Date.now() + 3600000), // In 1 hour
                estado: 'PROGRAMADO'
            }
        });
        console.log('Created test match:', match.id);
    }

    // Check if stream exists
    const existingStream = await prisma.streaming.findUnique({
        where: { partidoId: match.id }
    });

    if (!existingStream) {
        await prisma.streaming.create({
            data: {
                partidoId: match.id,
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll for test :D
                isLive: true
            }
        });
        console.log('Created test stream for match:', match.id);
    } else {
        console.log('Stream already exists for match:', match.id);
    }
}

seedStream()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
