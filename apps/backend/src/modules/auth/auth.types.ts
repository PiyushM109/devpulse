export interface RegisterInput {
    email: string;
    username: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}