import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { AppError } from '@/errors/AppError';

export interface AccessTokenPayload {
    sub: string;
    email: string;
    username: string;
    type: 'access';
}

export interface RefreshTokenPayload {
    sub: string;
    jti: string;
    type: 'refresh'
}

export interface TokenPair {
    accessTokes: string;
    refreshToken: string;
    expiresIn: number
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
    return jwt.sign(
        { ...payload, type: 'access' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    )
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
        if (token)
            if (payload.type !== 'access') {
                throw AppError.unauthorized('Invalid token type');
            }
        return payload;

    } catch (err) {
        if (err instanceof AppError) throw err;
        if (err instanceof jwt.TokenExpiredError) {
            throw AppError.unauthorized('Access token expired', 'TOKE EXPIRED');
        }
        throw AppError.unauthorized('Invalid access token')
    }
}

export function signRefreshToken(userId: string): { token: string; jti: string } {
    const jti = uuidv4();

    const token = jwt.sign(
        { sub: userId, jti, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )
    return { token, jti }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
        const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
        if (payload.type !== 'refresh') {
            throw AppError.unauthorized('Invalid token type');
        }
        return payload;
    } catch (err) {
        if (err instanceof AppError) throw err;
        if (err instanceof jwt.TokenExpiredError) {
            throw AppError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
        }
        throw AppError.unauthorized('Invalid refresh token');

    }
}

export function parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15min
    return parseInt(match[1]) * (units[match[2]] ?? 1);
}