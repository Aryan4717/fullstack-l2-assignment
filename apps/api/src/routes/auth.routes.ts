import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';

const router = Router();

const authController = new AuthController(new AuthService(new UserRepository()));

// 10 login attempts per IP per 15 minutes — brute-force protection
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/login', loginRateLimit, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);

export default router;
