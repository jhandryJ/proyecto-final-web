import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with UIDE faculties and careers...');

    // Crear Facultades
    const facultades = await Promise.all([
        prisma.facultad.upsert({
            where: { id: 1 },
            update: { nombre: 'Facultad de Ciencias Administrativas y Económicas' },
            create: {
                id: 1,
                nombre: 'Facultad de Ciencias Administrativas y Económicas',
            },
        }),
        prisma.facultad.upsert({
            where: { id: 2 },
            update: { nombre: 'Facultad de Arquitectura, Diseño y Arte' },
            create: {
                id: 2,
                nombre: 'Facultad de Arquitectura, Diseño y Arte',
            },
        }),
        prisma.facultad.upsert({
            where: { id: 3 },
            update: { nombre: 'Facultad de Jurisprudencia, Ciencias Sociales y Humanidades A. F. Córdova' },
            create: {
                id: 3,
                nombre: 'Facultad de Jurisprudencia, Ciencias Sociales y Humanidades A. F. Córdova',
            },
        }),
        prisma.facultad.upsert({
            where: { id: 4 },
            update: { nombre: 'Facultad de Ingenierías Digitales y Tecnologías Emergentes' },
            create: {
                id: 4,
                nombre: 'Facultad de Ingenierías Digitales y Tecnologías Emergentes',
            },
        }),
    ]);

    console.log('✅ Facultades creadas/actualizadas:', facultades.length);

    // Crear Carreras
    const carreras = [
        // Facultad de Ciencias Administrativas y Económicas
        { nombre: 'Administración de Empresas', facultadId: 1 },
        { nombre: 'Marketing', facultadId: 1 },
        { nombre: 'Negocios Internacionales', facultadId: 1 },

        // Facultad de Arquitectura, Diseño y Arte
        { nombre: 'Arquitectura', facultadId: 2 },

        // Facultad de Jurisprudencia, Ciencias Sociales y Humanidades
        { nombre: 'Derecho', facultadId: 3 },
        { nombre: 'Psicología Clínica', facultadId: 3 },

        // Facultad de Ingenierías Digitales y Tecnologías Emergentes
        { nombre: 'Ingeniería en Sistemas de la Información', facultadId: 4 },
    ];

    let carrerasCreadas = 0;
    for (const carrera of carreras) {
        await prisma.carrera.upsert({
            where: {
                nombre_facultadId: {
                    nombre: carrera.nombre,
                    facultadId: carrera.facultadId,
                },
            },
            update: {},
            create: carrera,
        });
        carrerasCreadas++;
    }

    console.log('✅ Carreras creadas/actualizadas:', carrerasCreadas);
    console.log('🎉 Seeding completado!');
    console.log('\n📊 Resumen:');
    console.log('  - 4 Facultades');
    console.log('  - 7 Carreras');
}

main()
    .catch((e) => {
        console.error('❌ Error en seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
