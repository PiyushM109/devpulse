import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from './logger';


export const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,


    retryStrategy(times) {
        if (times > 10) {
            logger.error('Redis : max reconnection attempts reached');
            return null
        }
        return Math.min(times * 200, 2000);
    },
    lazyConnect: true
});

redis.on('connect',()=>logger.info("Redis connected"));
redis.on('error',(err)=> logger.error({err}, 'Redis Error'));


export async function checkRedisConnection(): Promise<void> {
    await redis.connect();
    await redis.ping();
}

