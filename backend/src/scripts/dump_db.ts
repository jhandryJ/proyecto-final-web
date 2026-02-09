
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- EQUIPOS ---');
    const equipos = await prisma.equipo.findMany();
    equipos.forEach(e => console.log(`${e.id}: ${e.nombre}`));

    console.log('\n--- TORNEOS ---');
    const torneos = await prisma.torneo.findMany();
    torneos.forEach(t => console.log(`${t.id}: ${t.disciplina} ${t.categoria}`));

    console.log('\n--- EQUIPO_TORNEO ---');
    const et = await prisma.equipotorneo.findMany();
    if (et.length === 0) console.log('No entries.');
    et.forEach(x => console.log(`Torneo: ${x.torneoId}, Equipo: ${x.equipoId}, Estado: ${x.estado}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
