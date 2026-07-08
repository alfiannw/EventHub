// =============================================================================
// SPRINT 1: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS AuthService & RolesGuard Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from '../backend/src/auth/auth.service';
import { RedisService } from '../backend/src/redis/redis.service';

describe('Sprint 1: Authentication & RBAC Core Engines', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token-string'),
            verify: jest.fn().mockReturnValue({ sub: 'u-1', email: 'admin@eventhub.com', role: 'ADMIN' }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue('active'),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
            blacklistToken: jest.fn().mockResolvedValue(undefined),
            isTokenBlacklisted: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('User Registration', () => {
    it('should successfully register a new participant user with a hashed password', async () => {
      const email = 'new-guest@gmail.com';
      const name = 'New Guest';
      
      const result = await authService.register(email, 'securePassword123', name, 'PARTICIPANT');
      
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(email);
      expect(result.name).toBe(name);
      expect(result.role).toBe('PARTICIPANT');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw a ConflictException if the email address is already registered', async () => {
      // admin@eventhub.com is seeded by default in AuthService constructor
      await expect(
        authService.register('admin@eventhub.com', 'somePassword', 'Fake Admin')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('User Login & Session Cache', () => {
    it('should authenticate user and return access, refresh tokens and safe details', async () => {
      const loginRes = await authService.login('admin@eventhub.com', 'admin123');
      
      expect(loginRes).toHaveProperty('accessToken');
      expect(loginRes).toHaveProperty('refreshToken');
      expect(loginRes.user.email).toBe('admin@eventhub.com');
      expect(loginRes.user.role).toBe('ADMIN');
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException on incorrect password attempts', async () => {
      await expect(
        authService.login('admin@eventhub.com', 'incorrectPassword')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the user account is inactive', async () => {
      // Register an inactive user directly or toggle active status
      const user = await authService.register('inactive@eventhub.com', 'pwd123', 'Disabled Guest');
      (authService as any).usersTable.find(u => u.email === 'inactive@eventhub.com').isActive = false;

      await expect(
        authService.login('inactive@eventhub.com', 'pwd123')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Session Signout & Access Token Revocation', () => {
    it('should clean the active session from Redis and blacklist the token', async () => {
      const userId = 'u-1';
      const refreshToken = 'mock-refresh-token-string';
      const accessToken = 'mock-access-token-string';

      await authService.logout(userId, refreshToken, accessToken);

      expect(redisService.del).toHaveBeenCalled();
      expect(redisService.blacklistToken).toHaveBeenCalled();
    });
  });
});
