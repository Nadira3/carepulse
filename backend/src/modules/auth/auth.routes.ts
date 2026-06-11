import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { loginRateLimiter } from '../../common/middleware/rate-limiter';

const router = Router();

// Public — with rate limiting on login
router.post('/register', (req, res, next) =>
  authController.register(req, res, next)
);
router.post('/login', loginRateLimiter, (req, res, next) =>
  authController.login(req, res, next)
);
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);
router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// Protected
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);
router.post('/logout-all', authenticate, (req, res, next) =>
  authController.logoutAll(req, res, next)
);

export default router;
