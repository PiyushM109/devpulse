import pino from 'pino';
import { isDev } from '../config/env';

export const logger = pino({
    level: isDev ? 'debug' : 'info',
    ...(isDev && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                trnaslateTime: true,
                ignore: 'pid,hostname',
            }
        }
    })
})