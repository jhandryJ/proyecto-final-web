import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFacultiesIfNeeded() {
    try {
        // Verificar si ya existen facultades
        const existingFaculties = await prisma.facultad.count();

        if (existingFaculties > 0) {
            console.log('✅ Facultades ya existen. Saltando seed.');
            return;
        }

        console.log('🌱 Iniciando seed de Facultades y Carreras (UIDE Campus Loja)...');

        // Facultades y Carreras de UIDE - Campus Loja
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

        // Crear facultades y carreras
        let totalCarreras = 0;
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

            totalCarreras += facultad.carreras.length;
        }

        console.log(`✅ Seed completado: ${facultadesData.length} facultades y ${totalCarreras} carreras creadas`);
    } catch (error) {
        console.error('❌ Error en seed de facultades:', error);
    }
}

export { seedFacultiesIfNeeded };
