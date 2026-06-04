import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email("Must be a valid email address").toLowerCase().trim(),
    username: z.string().min(3, 'Username must ne at least 3 characters').max(30, 'Username must be at most 30 characters').
        regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens',).toLowerCase().trim(),
    password: z.string().min(8, 'password must be at least 8 characters').max(71, 'password most be at most 72 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),

});

export const loginSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, 'password is required'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;