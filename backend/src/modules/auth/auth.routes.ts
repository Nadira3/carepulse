import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireRole } from '../../common/middleware/authenticate';
import { loginRateLimiter } from '../../common/middleware/rate-limiter';

const router = Router();

// Public
router.post('/login',   loginRateLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh',                   (req, res, next) => authController.refresh(req, res, next));
router.post('/logout',                    (req, res, next) => authController.logout(req, res, next));

// Protected — any authenticated user
router.get('/me',         authenticate,                          (req, res, next) => authController.me(req, res, next));
router.post('/logout-all', authenticate,                         (req, res, next) => authController.logoutAll(req, res, next));

// Admin only — user management
router.post('/register',          authenticate, requireRole('ADMIN'), (req, res, next) => authController.register(req, res, next));
router.get('/users',              authenticate, requireRole('ADMIN'), (req, res, next) => authController.listUsers(req, res, next));
router.patch('/users/:id/status', authenticate, requireRole('ADMIN'), (req, res, next) => authController.updateUserStatus(req, res, next));

export default router;
