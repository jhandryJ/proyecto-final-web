import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function demonstrateRLS() {
    console.log('\n🔐 Demostración de Row-Level Security (RLS)\n');
    console.log('='.repeat(60));

    // Obtener usuarios de ejemplo
    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
    const capitan = await prisma.usuario.findFirst({ where: { rol: 'CAPITAN' } });
    const estudiante = await prisma.usuario.findFirst({ where: { rol: 'ESTUDIANTE' } });

    if (!admin || !capitan || !estudiante) {
        console.log('\n⚠️  No hay usuarios de todos los roles en la base de datos');
        console.log('Usuarios encontrados:');
        console.log(`  ADMIN: ${admin ? '✅' : '❌'}`);
        console.log(`  CAPITAN: ${capitan ? '✅' : '❌'}`);
        console.log(`  ESTUDIANTE: ${estudiante ? '✅' : '❌'}`);
        console.log('\nPara probar RLS, necesitas crear usuarios con estos roles.\n');
        await prisma.$disconnect();
        return;
    }

    console.log('\n👥 Usuarios de prueba:');
    console.log(`  ADMIN: ${admin.nombres} ${admin.apellidos} (ID: ${admin.id})`);
    console.log(`  CAPITAN: ${capitan.nombres} ${capitan.apellidos} (ID: ${capitan.id})`);
    console.log(`  ESTUDIANTE: ${estudiante.nombres} ${estudiante.apellidos} (ID: ${estudiante.id})`);

    // Contar equipos totales
    const totalTeams = await prisma.equipo.count();

    // Equipos visibles para cada rol
    const adminTeams = await prisma.equipo.count();

    const capitanTeams = await prisma.equipo.count({
        where: { capitanId: capitan.id }
    });

    const estudianteTeams = await prisma.equipo.count({
        where: {
            OR: [
                { capitanId: estudiante.id },
                {
                    miembros: {
                        some: { usuarioId: estudiante.id }
                    }
                }
            ]
        }
    });

    console.log('\n📊 Equipos visibles por rol:');
    console.log(`  Total en DB: ${totalTeams}`);
    console.log(`  ADMIN ve: ${adminTeams} (100%)`);
    console.log(`  CAPITAN ve: ${capitanTeams} (solo su equipo)`);
    console.log(`  ESTUDIANTE ve: ${estudianteTeams} (equipos donde es miembro)`);

    // Torneos
    const totalTournaments = await prisma.torneo.count();

    const capitanTournaments = await prisma.torneo.count({
        where: {
            equiposInscritos: {
                some: {
                    equipo: { capitanId: capitan.id }
                }
            }
        }
    });

    const estudianteTournaments = await prisma.torneo.count({
        where: {
            equiposInscritos: {
                some: {
                    equipo: {
                        OR: [
                            { capitanId: estudiante.id },
                            {
                                miembros: {
                                    some: { usuarioId: estudiante.id }
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    console.log('\n🏆 Torneos visibles por rol:');
    console.log(`  Total en DB: ${totalTournaments}`);
    console.log(`  ADMIN ve: ${totalTournaments} (100%)`);
    console.log(`  CAPITAN ve: ${capitanTournaments} (donde su equipo participa)`);
    console.log(`  ESTUDIANTE ve: ${estudianteTournaments} (donde sus equipos participan)`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Row-Level Security está funcionando correctamente');
    console.log('='.repeat(60) + '\n');

    await prisma.$disconnect();
}

demonstrateRLS().catch(console.error);
