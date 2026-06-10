import 'express-async-errors'
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { authRouters } from './modules/auth/auth.routes';

export function createApp(): Application {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: env.NODE_ENV === 'development'
            ? ['http://localhost:5173', 'http://localhost:3000']
            : (process.env.ALLOWED_ORIGINS ?? '').split(','),
        credentials: true,   // allows cookies/auth headers cross-origin
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    }));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    app.use(requestId);
    app.use(requestLogger);

    app.use('/health', healthRouter);
    app.use('/auth', authRouters);

    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Route not found',
            },
        });
    });

    app.use(errorHandler);

    return app;
}