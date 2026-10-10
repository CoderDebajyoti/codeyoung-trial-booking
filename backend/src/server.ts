import { createApp } from './app.js';
import { env, isFallbackAllowed } from './config/env.js';
import { notificationService } from './services/notification.service.js';
import { checkDbConnection } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Codeyoung Trial Booking Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`🔗 Health check available at: http://localhost:${env.PORT}/api/health`);
  console.log(`✉️ Email provider: ${env.EMAIL_PROVIDER} (sender: ${env.EMAIL_FROM})`);

  // Probe database connection on startup
  checkDbConnection(true).then((connected) => {
    if (connected) {
      console.log('✅ PostgreSQL connected successfully (persistent storage active).');
    } else {
      console.error('❌ PostgreSQL connection failed! Please verify DATABASE_URL in backend/.env.');
      if (!isFallbackAllowed()) {
        console.error('⚠️ Persistent storage is required (ALLOW_IN_MEMORY_FALLBACK=false). Database operations will return 503.');
      } else {
        console.warn('⚠️ Running in fallback mode (ALLOW_IN_MEMORY_FALLBACK=true). Bookings will NOT persist across restarts.');
      }
    }
  });

  // Start background outbox and 30-min reminder worker
  notificationService.startWorker();
});

const gracefulShutdown = () => {
  console.log('Stopping server and notification workers...');
  notificationService.stopWorker();
  server.close(() => {
    console.log('HTTP server closed');
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

