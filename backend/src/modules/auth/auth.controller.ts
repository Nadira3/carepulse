import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { authenticate } from '../../common/middleware/authenticate';
import { prisma } from '../../config/prisma';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const user = await authService.register(input);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.login(
        input.email,
        input.password
      );

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ accessToken, user });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oldToken =
        req.cookies?.refreshToken ??
        refreshTokenSchema.parse(req.body).refreshToken;

      const { accessToken, refreshToken } =
        await authService.refreshAccessToken(oldToken);

      // Rotate cookie too
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.clearCookie('refreshToken', { path: '/' });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
        return;
      }
      await authService.logoutAll(req.user.sub);
      res.clearCookie('refreshToken', { path: '/' });
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
}

export const authController = new AuthController();
