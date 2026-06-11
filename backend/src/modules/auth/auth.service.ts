import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { config } from '../../config/env';
import { JwtPayload, AuthTokens, AuthUser } from '../../common/types/auth.types';
import { AppError } from '../../common/errors/app-errors';

export class AuthService {
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT.ACCESS_SECRET, {
      expiresIn: config.JWT.ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT.REFRESH_SECRET, {
      expiresIn: config.JWT.REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'CLINICIAN';
  }): Promise<AuthUser> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError(
        `User with email '${input.email}' already exists`,
        409,
        'CONFLICT'
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role ?? 'CLINICIAN',
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<AuthTokens & { user: AuthUser }> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(
    oldRefreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify signature first
    let payload: JwtPayload;
    try {
      payload = jwt.verify(
        oldRefreshToken,
        config.JWT.REFRESH_SECRET
      ) as JwtPayload;
    } catch {
      throw new AppError(
        'Invalid or expired refresh token',
        401,
        'INVALID_TOKEN'
      );
    }

    // Check it exists in DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      // Possible token reuse attack — delete all tokens for this user
      if (stored) {
        await prisma.refreshToken.deleteMany({
          where: { userId: stored.userId },
        });
      }
      throw new AppError(
        'Invalid or expired refresh token',
        401,
        'INVALID_TOKEN'
      );
    }

    // Rotate: delete old token, issue new one
    await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });

    const newPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    const accessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.userId,
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT.ACCESS_SECRET) as JwtPayload;
    } catch {
      throw new AppError(
        'Invalid or expired access token',
        401,
        'INVALID_TOKEN'
      );
    }
  }
}

export const authService = new AuthService();
