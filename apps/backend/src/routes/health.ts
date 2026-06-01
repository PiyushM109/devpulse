import { Router, Request, Response } from 'express';
import { db } from '@/db/client';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
    const checks = {
        database: 'unknown' as 'ok' | 'error' | 'unknown',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        requestId: req.requestId
    };

    try {
        await db.query('SELECT 1');
        checks.database = 'ok';
    } catch (err) {
        checks.database = 'error';
        logger.error({ err }, 'Health check :database unreacheble');
    }

    const allHealthy = checks.database === 'ok';

    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        checks
    });
});

export { router as healthRouter }