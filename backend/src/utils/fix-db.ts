import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to drop conflicting constraints...');
    try {
        // En MySQL, a veces el index y el FK tienen el mismo nombre o Prisma generó uno específico
        // Intentamos borrar el FK primero
        await prisma.$executeRawUnsafe(`ALTER TABLE Equipo DROP FOREIGN KEY Equipo_capitanId_fkey;`);
        console.log('✅ Foreign Key Equipo_capitanId_fkey dropped.');
    } catch (e: any) {
        console.log('⚠️ Could not drop FK (might not exist):', e.message);
    }

    try {
        // Luego el índice
        await prisma.$executeRawUnsafe(`DROP INDEX Equipo_capitanId_fkey ON Equipo;`);
        console.log('✅ Index Equipo_capitanId_fkey dropped.');
    } catch (e: any) {
        console.log('⚠️ Could not drop Index (might not exist):', e.message);
    }

    try {
        // [FIX] Manually add the missing column that causes the 500 error
        await prisma.$executeRawUnsafe(`ALTER TABLE ValidacionPago ADD COLUMN torneoId INT NULL;`);
        console.log('✅ Added torneoId column to ValidacionPago');
    } catch (e: any) {
        console.log('⚠️ Could not add torneoId (might exist):', e.message);
    }

    try {
        // [FIX] Add FK for safety
        await prisma.$executeRawUnsafe(`ALTER TABLE ValidacionPago ADD CONSTRAINT ValidacionPago_torneoId_fkey FOREIGN KEY (torneoId) REFERENCES Torneo(id) ON DELETE SET NULL ON UPDATE CASCADE;`);
        console.log('✅ Added FK for torneoId');
    } catch (e: any) {
        console.log('⚠️ Could not add FK for torneoId:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
