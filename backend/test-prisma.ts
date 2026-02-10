
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma connection...');
    try {
        const count = await prisma.equipo.count();
        console.log(`Successfully connected! Team count: ${count}`);
    } catch (e: any) {
        console.error('Prisma connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
