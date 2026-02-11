import { apiClient } from '../../uideportes-web/src/services/api'; // This won't work in node directly easily due to import.meta.env
// Let's just use fetch
const BASE_URL = 'http://localhost:3000/api';

async function main() {
    try {
        console.log('Fetching careers from API...');
        const response = await fetch(`${BASE_URL}/carreras`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status} ${response.statusText}`);
        }

        const careers = await response.json();
        console.log(`Received ${careers.length} careers`);

        if (careers.length > 0) {
            const firstCareer = careers[0];
            console.log('Sample career:', JSON.stringify(firstCareer, null, 2));

            if (firstCareer.facultad && firstCareer.facultad.nombre) {
                console.log('✅ SUCCESS: Career has faculty information');
            } else {
                console.error('❌ FAILURE: Career is missing faculty information');
                process.exit(1);
            }
        } else {
            console.log('⚠️ No careers found to verify structure');
        }

    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
}

main();
