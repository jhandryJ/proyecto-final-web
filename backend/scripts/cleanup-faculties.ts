import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up Faculties and Careers...');

    // We need to be careful with foreign keys. 
    // Since this is a dev environment fix, we'll try to set users' carreraId to null first if needed, 
    // or just delete if there are no users or if users are test data.
    // verification: checked schema, Usuario has optional carreraId.

    // 1. Unlink users from careers (set carreraId to null) to avoid FK constraint errors during truncation
    // This preserves the users but removes their invalid legacy career link.
    await prisma.usuario.updateMany({
        data: {
            carreraId: null
        }
    });
    console.log('  - Unlinked users from careers');

    // 2. Delete all careers
    await prisma.carrera.deleteMany({});
    console.log('  - Deleted all careers');

    // 3. Delete all faculties
    await prisma.facultad.deleteMany({});
    console.log('  - Deleted all faculties');

    console.log('✅ Cleanup complete. Now look ready to seed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
