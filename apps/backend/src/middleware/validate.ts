import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod/v3";
import { AppError } from "@/errors/AppError";

export function validate<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodErrors(result.error);
            throw AppError.badRequest(
                `Validation failed: ${errors[0]}`,
                'VALIDATION_ERROR',
            );
        }
        req.body = result.data;
        next();
    }
}

function formatZodErrors(error: ZodError): string[] {
    return error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
    });
}