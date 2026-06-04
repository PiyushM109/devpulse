import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { AppError } from "@/errors/AppError";
import { redis, refreshTokens } from "@/utils/redis";
import { signAccessToken, signRefreshToken, verifyRefreshToken, parseExpiresIn } from "@/utils/jwt";
import { env } from "@/config/env";
import type { RegisterInput, LoginInput, AuthUser, AuthResponse } from "./auth.types";


const BCRYPT_ROUNDS = 12;

function mapRowToUser(row: Record<string, unknown>): AuthUser {
    return {
        id: row.id as string,
        email: row.email as string,
        username: row.username as string,
        avatarUrl: row.avatar_ur as string | null,
        isActive: row.is_Active as boolean,
        createdAt: row.created_At as Date
    };
}

function buildTokenPair(user: AuthUser) {
    const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        username: user.username,
    });

    const { token: refreshToken, jti } = signRefreshToken(user.id);

    const expiresIn = parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN);

    return { accessToken, refreshToken, jti, expiresIn };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await db.query(
        `SELECT id 
         FROM users
         WHERE email=$1 OR username = $2`,
        [input.email, input.username]
    );

    if (existing.rows.length > 0) {
        const taken = existing.rows[0] as { email?: string; username?: string };

        throw AppError.conflict(
            taken.email === input.email ? 'An account with this email already exists' : 'THis username is already taken'
        );
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const result = await db.query(`I
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, avatar_url, is_active, created_at
        `,
        [input.email, input.username, passwordHash]
    );

    const user = mapRowToUser(result.rows[0]);

    const { accessToken, refreshToken, jti, expiresIn } = buildTokenPair(user);

    const refreshTtl = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
    await refreshTokens.save(user.id, jti, refreshTtl);

    await db.query(
        'INSERT INTO notification_preferences (user_id) VALUES ($1)',
        [user.id]
    );

    return { user, accessToken, refreshToken, expiresIn }

}

export async function login(input: LoginInput): Promise<AuthResponse> {
    const result = await db.query(
        `
            SELECT id, email, username, password_hash, avatar_url, is_Active, created_at
            FROM users
            WHERE email = $1
        `,
        [input.email]
    );

    const row = result.rows[0] as (Record<string, unknown> & { password_hash: string | null }) || undefined;

    const dummyHash = '$2b$12$invalidhashfortimingattackprevention000000000000000000';
    //dummy hash is used to avoid the timing attack so that the response will be same weather the email exists or not or the password is wrong in this way the attacker can not guess if email exists in the db or not

    const hashToCompare = row?.password_hash ?? dummyHash;

    const passwordValid = await bcrypt.compare(input.password, hashToCompare);

    if (!row || !passwordValid) {
        throw AppError.unauthorized('Invalid Email or passowrd');
    }

    if (!row.is_active) {
        throw AppError.forbidden('Account is deactivated please contact the support')
    }

    if (!row.password_hash) {
        throw AppError.badRequest('This account uses Github login, Please sign with Github')
    }

    const user = mapRowToUser(row);

    const { accessToken, refreshToken, jti, expiresIn } = buildTokenPair(user);

    const refreshTtl = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
    await refreshTokens.save(user.id, jti, refreshTtl);

    return { user, accessToken, refreshToken, expiresIn };
}

export async function refresh(token: string): Promise<Omit<AuthResponse, 'user'>> {
    const payload = verifyRefreshToken(token);

    const valid = await refreshTokens.exists(payload.sub, payload.jti);

    if (!valid) {
        throw AppError.unauthorized('Reefresh token has been revoked', 'TOKEN REVOKED');
    }

    const result = await db.query(
        `SELECT id, email, username, avatar_url, is_Active, created_at
         FROM users
         WHERE id = $1
        `,
        [payload.sub]
    );

    const row = result.rows[0] as Record<string, unknown> | undefined;

    if (!row || !row.is_Active) {
        throw AppError.unauthorized('Account not found or deactivated');
    }

    await refreshTokens.revoke(payload.sub, payload.jti);

    const user = mapRowToUser(row);
    const { accessToken, refreshToken: newRefreshToken, jti, expiresIn } = buildTokenPair(user);

    const refreshTtl = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
    await refreshTokens.save(user.id, jti, refreshTtl);

    return { accessToken, refreshToken: newRefreshToken, expiresIn };
}

export async function logout(userId: string, tokenId: string): Promise<void> {
    await refreshTokens.revoke(userId, tokenId);
}

export async function logoutAll(userId: string): Promise<void> {
    await refreshTokens.revokeAll(userId);
}


export async function getMe(userId: string): Promise<AuthUser> {
    const result = await db.query(
        'SELECT id, email, username, avatar_url, is_active, created_at FROM users WHERE id = $1',
        [userId],
    );

    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) throw AppError.notFound('User not found');

    return mapRowToUser(row);
}