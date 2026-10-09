import { env } from '../src/config/env.js';
import { createEmailService } from '../src/services/email.service.js';

async function main() {
  console.log('======================================================');
  console.log('📬 Codeyoung Trial Booking — Email Delivery Smoke Test');
  console.log('======================================================');
  console.log(`Current Provider: ${env.EMAIL_PROVIDER}`);
  console.log(`Configured Sender: ${env.EMAIL_FROM}`);

  if (env.EMAIL_PROVIDER === 'smtp') {
    console.log(`SMTP Server: ${env.SMTP_HOST}:${env.SMTP_PORT} (secure: ${env.SMTP_SECURE})`);
    console.log(`SMTP User: ${env.SMTP_USER ? env.SMTP_USER : '(none / unauthenticated)'}`);
  } else if (env.EMAIL_PROVIDER === 'resend') {
    console.log(`Resend API Key: ${env.RESEND_API_KEY ? '******' + env.RESEND_API_KEY.slice(-4) : '(NOT CONFIGURED)'}`);
  }

  // Parse recipient from command line args: --to=user@example.com
  const args = process.argv.slice(2);
  let recipient = 'test@example.com';
  for (const arg of args) {
    if (arg.startsWith('--to=')) {
      recipient = arg.replace('--to=', '').trim();
    }
  }

  console.log(`Recipient Target: ${recipient}\n`);

  const emailService = createEmailService();

  // 1. Check configuration
  const configCheck = await emailService.verifyConfiguration();
  console.log(`Configuration Check: ${configCheck.valid ? '✅ VALID' : '⚠️ WARNING / INVALID'}`);
  console.log(`Details: ${configCheck.message}\n`);

  // 2. Attempt test delivery
  console.log(`🚀 Sending test trial class confirmation to: ${recipient}...`);
  const result = await emailService.sendEmail({
    to: recipient,
    subject: `[TEST] Codeyoung 1:1 Trial Class Booking Verification`,
    text: `Hello!\n\nThis is a verification email from Codeyoung Trial Class Booking System.\nIf you received this email, your ${env.EMAIL_PROVIDER.toUpperCase()} provider configuration is working correctly!\n\nBooking Reference: TEST-${Date.now()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">✅ Codeyoung Email Delivery Test</h2>
        <p>Congratulations! Your real email delivery integration via <strong>${env.EMAIL_PROVIDER.toUpperCase()}</strong> is operating properly.</p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Provider:</strong> ${env.EMAIL_PROVIDER}</p>
          <p style="margin: 4px 0;"><strong>Sender:</strong> ${env.EMAIL_FROM}</p>
          <p style="margin: 4px 0;"><strong>Target Recipient:</strong> ${recipient}</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
        <p>You can now test live bookings from the frontend UI.</p>
      </div>
    `,
  });

  if (result.success && result.status === 'ACCEPTED') {
    console.log('\n🎉 SUCCESS! Email was accepted by the provider.');
    console.log(`Message ID: ${result.messageId || 'N/A'}`);
    console.log(`Status: ${result.status}`);
  } else {
    console.error('\n❌ FAILURE! Email could not be delivered.');
    console.error(`Status: ${result.status}`);
    console.error(`Error details: ${result.error}`);
    console.error('\nTroubleshooting Checklist:');
    if (env.EMAIL_PROVIDER === 'resend') {
      console.error('- Ensure RESEND_API_KEY is set in backend/.env');
      console.error('- Ensure EMAIL_FROM matches a domain verified in Resend (or onboarding@resend.dev for test recipients)');
    } else if (env.EMAIL_PROVIDER === 'smtp') {
      console.error('- For Gmail: Use a 16-character App Password (not your Gmail account password)');
      console.error('- Ensure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set in backend/.env');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error running email test script:', err);
  process.exit(1);
});
