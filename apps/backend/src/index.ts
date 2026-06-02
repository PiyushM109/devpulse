import 'dotenv/config';
import { env } from './config/env';
import { logger } from './utils/logger';
import { checkDbConnection } from './db/client';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  logger.info('DevPulse backend starting...');

  await checkDbConnection();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({
      msg: 'Server ready',
      port: env.PORT,
      environment: env.NODE_ENV,
      pid: process.pid,
    });
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});