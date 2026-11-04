import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas/authSchemas.js';
import { authenticateUser } from '../middleware/auth.js';
import { requireValidOrigin } from '../middleware/originCheck.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh', requireValidOrigin, AuthController.refresh);
router.post('/logout', requireValidOrigin, AuthController.logout);
router.get('/me', authenticateUser, AuthController.getMe);
router.patch('/profile', authenticateUser, validateBody(updateProfileSchema), AuthController.updateProfile);

export default router;


