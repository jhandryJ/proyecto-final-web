import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.usuario.findMany({
            select: {
                id: true,
                email: true,
                nombres: true,
                apellidos: true,
                rol: true,
            },
            orderBy: {
                id: 'asc'
            }
        });

        if (users.length === 0) {
            console.log('\n❌ No hay usuarios en la base de datos\n');
        } else {
            console.log('\n📋 Usuarios en la base de datos:\n');
            console.log('ID | Email                    | Nombre                | Rol');
            console.log('---|--------------------------|----------------------|-------------');
            users.forEach(user => {
                const id = String(user.id).padEnd(2);
                const email = (user.email || 'N/A').padEnd(24);
                const nombre = `${user.nombres} ${user.apellidos}`.padEnd(20);
                const rol = user.rol || 'N/A';
                console.log(`${id} | ${email} | ${nombre} | ${rol}`);
            });
            console.log('');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

listUsers();
