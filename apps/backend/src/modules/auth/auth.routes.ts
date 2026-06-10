import { Router } from "express";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/authenticate";
import { registerController, loginController, refreshController, logoutController, logoutAllController, getMeController } from "./auth.controller";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema";

const router: Router = Router();

router.post('/register', validate(registerSchema as any), registerController);
router.post('/login', validate(loginSchema as any), loginController);
router.post('/refresh', validate(refreshSchema as any), refreshController);
router.post('/logout', logoutController);

router.get('/me', authenticate, getMeController);
router.post('/logout-all', authenticate, logoutAllController);

export { router as authRouters }
