import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema, updateUserStatusSchema } from './auth.validation';
import { authenticate } from '../../common/middleware/authenticate';
import { prisma } from '../../config/prisma';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const user  = await authService.register(input);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input                      = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.login(input.email, input.password);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ accessToken, user });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'No refresh token' });
        return;
      }
      const { accessToken, refreshToken } = await authService.refreshAccessToken(token);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.sub;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
        return;
      }
      await authService.logoutAll(userId);
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out from all devices' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where:  { id: (req.user as any).sub },
        select: {
          id:        true,
          email:     true,
          firstName: true,
          lastName:  true,
          role:      true,
          isActive:  true,
        },
      });
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not found' });
        return;
      }
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip  = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id:          true,
            email:       true,
            firstName:   true,
            lastName:    true,
            role:        true,
            isActive:    true,
            lastLoginAt: true,
            createdAt:   true,
          },
        }),
        prisma.user.count(),
      ]);

      res.status(200).json({
        results:    users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const input  = updateUserStatusSchema.parse(req.body);

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
        return;
      }

      // Prevent admin from deactivating themselves
      if (id === (req.user as any).sub && !input.isActive) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Cannot deactivate your own account' });
        return;
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   { isActive: input.isActive },
        select: {
          id: true, email: true, firstName: true,
          lastName: true, role: true, isActive: true,
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
