import { prisma } from './src/utils/prisma.js';

async function debugStreaming() {
    try {
        console.log('Testing streaming query...');
        const streams = await prisma.streaming.findMany({
            include: {
                partido: true
            }
        });
        console.log('Successfully fetched streams:', streams.length);
    } catch (error) {
        console.error('ERROR during findMany:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugStreaming();
