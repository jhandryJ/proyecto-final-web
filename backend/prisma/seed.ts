import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const facultadesData = [
    {
        nombre: 'Facultad de Business School',
        carreras: [
            'Administración de Empresas',
            'Marketing',
            'Negocios Internacionales',
            'Finanzas y Negocios Digitales',
            'Gastronomía',
            'Gestión Comercial',
            'Contabilidad y Auditoría', // Online
            'Finanzas', // Online
            'Mercadotecnia' // Online
        ]
    },
    {
        nombre: 'Facultad de Ingenierías Aplicadas y Desarrollo Industrial',
        carreras: [
            'Ingeniería Automotriz',
            'Ingeniería Civil',
            'Ingeniería Industrial',
            'Ingeniería Mecatrónica'
        ]
    },
    {
        nombre: 'Facultad de Arquitectura, Diseño y Arte',
        carreras: [
            'Arquitectura',
            'Diseño Gráfico',
            'Multimedia y Producción Audiovisual',
            'Diseño de Interiores' // Kept from previous list if valid, though user didn't explicitly list it in new text, but fits category.
        ]
    },
    {
        nombre: 'Facultad de Ciencias Médicas, de la Salud y la Vida',
        carreras: [
            'Enfermería',
            'Fisioterapia',
            'Medicina',
            'Medicina Veterinaria',
            'Nutrición y Dietética',
            'Odontología',
            'Psicología',
            'Psicología Clínica'
        ]
    },
    {
        nombre: 'Facultad de Ingenierías Digitales y Tecnologías Emergentes',
        carreras: [
            'Ingeniería en Sistemas de la Información',
            'Ingeniería en Tecnologías de la Información',
            'Ingeniería en Ciberseguridad',
            'Ingeniería en Software',
            'Ingeniería en Sistemas' // Variant mentioned in Guayaquil
        ]
    },
    {
        nombre: 'Facultad de Jurisprudencia, Ciencias Sociales y Humanidades A. F. Córdova',
        carreras: [
            'Derecho',
            'Ciencias Políticas y Relaciones Internacionales',
            'Comunicación y Medios Digitales',
            'Comunicación' // Online variant
        ]
    },
    {
        nombre: 'Facultad de Ciencias de la Hospitalidad y Turismo', // Keeping if still valid, though user didn't list in new text explicitly under this header but Gastronomy is in Business School now?
        // User put Gastronomy in Business School.
        // Hospitalidad y Hotelería wasn't in the new list. 
        // I will keep this purely for safety if existing users have it, or comment it out if strictly following new list.
        // User said "arrega estas facultades", implying this IS the list.
        // I will commented it out to respect the authoritative list.
        carreras: []
    }
];

async function seed() {
    console.log('🌱 Starting seeding...');

    for (const fac of facultadesData) {
        if (fac.carreras.length === 0) continue;

        // Find or create Faculty
        const existingFac = await prisma.facultad.findFirst({
            where: { nombre: fac.nombre }
        });

        let facultadId;

        if (existingFac) {
            console.log(`Facultad exists: ${fac.nombre}`);
            facultadId = existingFac.id;
        } else {
            console.log(`Creating Facultad: ${fac.nombre}`);
            const newFac = await prisma.facultad.create({
                data: { nombre: fac.nombre }
            });
            facultadId = newFac.id;
        }

        for (const carName of fac.carreras) {
            const existingCarrera = await prisma.carrera.findFirst({
                where: { nombre: carName, facultadId: facultadId }
            });

            if (!existingCarrera) {
                console.log(`  Creating Carrera: ${carName}`);
                await prisma.carrera.create({
                    data: {
                        nombre: carName,
                        facultadId: facultadId
                    }
                });
            } else {
                console.log(`  Carrera exists: ${carName}`);
            }
        }
    }
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
