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

redis.on('connect', () => logger.info("Redis connected"));
redis.on('error', (err) => logger.error({ err }, 'Redis Error'));


export async function checkRedisConnection(): Promise<void> {
    await redis.connect();
    await redis.ping();
}

//Refresh Token Helpers

const REFRESH_PREFIX = 'refresh';

export const refreshTokens = {
    async save(userId: string, tokenId: string, ttlSeconds: number): Promise<void> {
        await redis.set(
            `${REFRESH_PREFIX}:${userId}:${tokenId}`,
            '1',
            'EX',
            ttlSeconds
        )
    },

    async exists(userId: string, tokenId: string): Promise<boolean> {
        const result = await redis.exists(`${REFRESH_PREFIX}:${userId}:${tokenId}`);
        return result === 1;
    },

    async revoke(userId: string, tokenId: String): Promise<void> {
        await redis.del(`${REFRESH_PREFIX}:${userId}:${tokenId}`);
    },

    async revokeAll(userId: string): Promise<void> {
        const keys = await redis.keys(`${REFRESH_PREFIX}:${userId}:*`);
        if (keys.length > 0) await redis.del(...keys);
    }
}

