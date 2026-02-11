import { prisma } from '../utils/prisma.js';

async function main() {
    try {
        console.log('Testing database connection...');
        const count = await prisma.facultad.count();
        console.log(`Successfully connected! Found ${count} faculties.`);
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
