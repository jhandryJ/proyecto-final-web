import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de Facultades y Carreras (UIDE Campus Loja)...');

    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando datos antiguos...');
    // Primero eliminar carreras por la relación foreign key
    await prisma.carrera.deleteMany();
    await prisma.facultad.deleteMany();

    // 2. Definir nuevos datos
    const facultadesData = [
        {
            nombre: 'Facultad de Business School',
            carreras: [
                'Administración de Empresas',
                'Marketing',
                'Negocios Internacionales'
            ]
        },
        {
            nombre: 'Facultad de Arquitectura, Diseño y Arte',
            carreras: [
                'Arquitectura'
            ]
        },
        {
            nombre: 'Facultad de Jurisprudencia, Ciencias Sociales y Humanidades A. F. Córdova',
            carreras: [
                'Derecho',
                'Psicología Clínica'
            ]
        },
        {
            nombre: 'Facultad de Ingenierías Digitales y Tecnologías Emergentes / Ciencias Técnicas',
            carreras: [
                'Ingeniería en Sistemas de la Información'
            ]
        }
    ];

    // 3. Crear nuevos registros
    for (const facultadData of facultadesData) {
        const facultad = await prisma.facultad.create({
            data: {
                nombre: facultadData.nombre,
                carreras: {
                    create: facultadData.carreras.map(nombre => ({ nombre }))
                }
            },
            include: {
                carreras: true
            }
        });

        console.log(`✅ Creada: ${facultad.nombre} con ${facultad.carreras.length} carreras`);
    }

    console.log('🎉 Seed completado exitosamente! Base de datos actualizada con las facultades de Loja.');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
