import { createApp } from './app.js';
import { env } from './config/env.js';
import { notificationService } from './services/notification.service.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Codeyoung Trial Booking Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`🔗 Health check available at: http://localhost:${env.PORT}/api/health`);
  console.log(`✉️ Email provider: ${env.EMAIL_PROVIDER} (sender: ${env.EMAIL_FROM})`);

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
