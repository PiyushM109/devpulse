import { Request, Response } from 'express';
import * as authService from './auth.service';
import { verifyRefreshToken } from '@/utils/jwt';
import { AppError } from '@/errors/AppError';
import type { RegisterInput, LoginInput } from './auth.schema';

export async function registerController(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
    const result = await authService.register(req.body);

    res.status(201).json({
        success: true,
        data: result
    });
}

export async function loginController(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
    const result = await authService.login(req.body);

    res.status(200).json({
        success: true,
        data: result
    })
}

export async function refreshController(
    req: Request,
    res: Response,
): Promise<void> {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await authService.refresh(refreshToken);

    res.status(200).json({
        success: true,
        data: result,
    });
}


export async function logoutController(
    req: Request,
    res: Response,
): Promise<void> {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
        try {
            const payload = verifyRefreshToken(refreshToken);
            await authService.logout(payload.sub, payload.jti);
        } catch {
            // Even if token is invalid/expired, proceed — logout should always succeed
        }
    }

    res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
    });
}

export async function logoutAllController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw AppError.unauthorized();
    }
    await authService.logoutAll(req.user.id);

    res.status(200).json({
        success: true,
        data: { message: 'Logged out from all devices' }
    })

}

export async function getMeController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw AppError.unauthorized();
    }

    const user = await authService.getMe(req.user.id);

    res.status(200).json({
        success: true,
        data: { user },
    });
}