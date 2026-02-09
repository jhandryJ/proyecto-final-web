import { prisma } from './src/utils/prisma.js';

async function migrate() {
    try {
        console.log('Attempting manual SQL migration...');

        // Check if columns exist first (optional but safer)
        // For simplicity in this environment, we'll just try to add them and catch error if they exist
        try {
            await prisma.$executeRawUnsafe('ALTER TABLE streaming ADD COLUMN likes INT DEFAULT 0');
            console.log('Added likes column');
        } catch (e: any) {
            console.log('Likes column might already exist or error:', e.message);
        }

        try {
            await prisma.$executeRawUnsafe('ALTER TABLE streaming ADD COLUMN views INT DEFAULT 0');
            console.log('Added views column');
        } catch (e: any) {
            console.log('Views column might already exist or error:', e.message);
        }

        console.log('Migration attempt finished.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
