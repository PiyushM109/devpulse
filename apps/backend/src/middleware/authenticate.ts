import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { db } from '@/db/client';
import { AppError } from '@/errors/AppError';


export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        throw AppError.unauthorized('Authorization header missiong or malformed');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const result = await db.query(
        `
            SELECT id, email, username, is_active
            FROM users
            WHERE id = $1
        `,
        [payload.sub]
    );

    const user = result.rows[0] as
        | { id: string; email: string; username: string; is_active: boolean } | undefined;

    if (!user || !user.is_active) {
        throw AppError.unauthorized('Account not found or deactivated');
    }

    req.user = {
        id: user.id,
        email: user.email,
        username: user.username
    };

    next();
}

export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.headers.authorization) {
        next();
        return;
    }
    return authenticate(req, res, next);
}