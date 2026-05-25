import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        username: string;
        role?: string;
      };
    }
  }
}

export {};