import { AuthService } from './auth.service';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';

jest.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockUser = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  email: 'doctor@hospital.com',
  passwordHash: bcrypt.hashSync('SecurePass123', 12),
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'CLINICIAN',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.register({
        email: 'doctor@hospital.com',
        password: 'SecurePass123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.email).toBe('doctor@hospital.com');
      expect(result.role).toBe('CLINICIAN');
    });

    it('should throw 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        service.register({
          email: 'doctor@hospital.com',
          password: 'SecurePass123',
          firstName: 'Jane',
          lastName: 'Doe',
        })
      ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });
  });

  describe('login', () => {
    it('should return tokens and user for valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.login('doctor@hospital.com', 'SecurePass123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('doctor@hospital.com');
    });

    it('should throw 401 for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        service.login('doctor@hospital.com', 'WrongPassword')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('should throw 401 for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.login('nobody@hospital.com', 'AnyPassword')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('should throw 401 for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login('doctor@hospital.com', 'SecurePass123')
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('refreshAccessToken', () => {
    it('should rotate refresh token — delete old, create new, return new tokens', async () => {
      // Step 1: login to get a real refresh token
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const { refreshToken: oldToken } = await service.login(
        'doctor@hospital.com',
        'SecurePass123'
      );

      // Step 2: clear mocks so we only count calls from the refresh operation
      jest.clearAllMocks();

      // Wait 1s so new JWT has different iat
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Step 3: mock DB calls for the refresh
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
        token: oldToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      });
      (prisma.refreshToken.delete as jest.Mock).mockResolvedValueOnce({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.refreshAccessToken(oldToken);

      // Token values exist
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Rotation happened — old deleted, new created (counts from clearAllMocks)
      expect(prisma.refreshToken.delete).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: oldToken },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);

      // New token is different from old
      expect(result.refreshToken).not.toBe(oldToken);
    });

    it('should throw 401 for invalid refresh token string', async () => {
      await expect(
        service.refreshAccessToken('invalid.token.string')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_TOKEN' });
    });

    it('should throw 401 for expired token in DB', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const { refreshToken } = await service.login(
        'doctor@hospital.com',
        'SecurePass123'
      );

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
        token: refreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000), // expired
        user: mockUser,
      });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({});

      await expect(
        service.refreshAccessToken(refreshToken)
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_TOKEN' });
    });

    it('should delete all user tokens on suspected reuse attack', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const { refreshToken } = await service.login(
        'doctor@hospital.com',
        'SecurePass123'
      );

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
        token: refreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 2,
      });

      await expect(
        service.refreshAccessToken(refreshToken)
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for valid token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const { accessToken } = await service.login(
        'doctor@hospital.com',
        'SecurePass123'
      );
      const payload = service.verifyAccessToken(accessToken);

      expect(payload.email).toBe('doctor@hospital.com');
      expect(payload.role).toBe('CLINICIAN');
    });

    it('should throw 401 for invalid token', () => {
      expect(() => service.verifyAccessToken('invalid.token.here')).toThrow();
    });
  });

  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 1,
      });

      await service.logout('some-refresh-token');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-refresh-token' },
      });
    });
  });

  describe('logoutAll', () => {
    it('should delete all refresh tokens for user', async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 3,
      });

      await service.logoutAll(mockUser.id);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });
});
