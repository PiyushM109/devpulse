import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { isDev } from '../config/env';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    stack?: string;       // only in development
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,   // must have 4 params — Express identifies error handlers this way
): void {
  // ── AppError (operational, expected) ────────────────────────
  if (err instanceof AppError) {
    logger.warn({
      requestId: req.requestId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
        ...(isDev && { stack: err.stack }),
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── ZodError (validation, should be caught by validate middleware) ──
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues,
        requestId: req.requestId,
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── Unexpected error (bug, DB crash, etc.) ───────────────────
  logger.error({
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      // Never leak internal error details in production
      message: isDev ? err.message : 'An unexpected error occurred',
      requestId: req.requestId,
      ...(isDev && { stack: err.stack }),
    },
  } satisfies ErrorResponse);
}