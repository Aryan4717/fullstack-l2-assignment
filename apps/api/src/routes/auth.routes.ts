import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';

const router = Router();

const authController = new AuthController(new AuthService(new UserRepository()));

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);

export default router;
