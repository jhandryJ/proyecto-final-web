import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTipoSorteo() {
    console.log('Actualizando tipoSorteo en torneos existentes...');

    const torneos = await prisma.torneo.findMany();

    for (const torneo of torneos) {
        let tipoSorteo: string;

        switch (torneo.categoria) {
            case 'FASE_GRUPOS':
                tipoSorteo = 'GRUPOS';
                break;
            case 'ELIMINATORIA':
                tipoSorteo = 'BRACKET';
                break;
            case 'TODOS_CONTRA_TODOS':
                tipoSorteo = 'GRUPOS';
                break;
            default:
                tipoSorteo = 'BRACKET';
        }

        await prisma.torneo.update({
            where: { id: torneo.id },
            data: { tipoSorteo }
        });

        console.log(`✅ Torneo ${torneo.id} (${torneo.categoria}) -> tipoSorteo: ${tipoSorteo}`);
    }

    console.log('✅ Actualización completada!');
    await prisma.$disconnect();
}

fixTipoSorteo().catch(console.error);
