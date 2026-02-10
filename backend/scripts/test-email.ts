import { sendEmail } from '../src/services/email.service.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testEmail = async () => {
    const targetEmail = process.argv[2];
    if (!targetEmail) {
        console.error('Usage: npx tsx scripts/test-email.ts <email>');
        process.exit(1);
    }

    console.log(`Sending test email to ${targetEmail}...`);
    const result = await sendEmail(
        targetEmail,
        'Test Email from UIDEportes',
        '<h1>It Works!</h1><p>This is a test email from the UIDEportes backend.</p>'
    );

    if (result.success) {
        console.log('✅ Email sent successfully!');
    } else {
        console.error('❌ Failed to send email:', result.error);
    }
};

testEmail();
