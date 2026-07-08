import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

// Simple structural memory store representing database layers
import { UserEntity } from '../users/user.entity';

@Injectable()
export class AuthService {
  // Simple in-memory user list simulating a PostgreSQL table connection
  private usersTable: UserEntity[] = [];

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    // Seed default admin and manager users with hashed credentials
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    this.usersTable.push(
      { id: 'u-1', email: 'admin@eventhub.com', passwordHash: adminHash, name: 'Admin User', role: 'ADMIN', isActive: true },
      { id: 'u-2', email: 'manager@eventhub.com', passwordHash: managerHash, name: 'Manager User', role: 'MANAGER', isActive: true },
      { id: 'u-3', email: 'staff@eventhub.com', passwordHash: staffHash, name: 'Staff User', role: 'STAFF', isActive: true }
    );
  }

  async register(email: string, passwordPlain: string, name: string, role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT' = 'PARTICIPANT'): Promise<Omit<UserEntity, 'passwordHash'>> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.usersTable.find(u => u.email === normalizedEmail);
    if (existing) {
      throw new ConflictException('A user with this email address already exists.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);
    
    const newUser: UserEntity = {
      id: `u-${Date.now()}`,
      email: normalizedEmail,
      passwordHash,
      name,
      role,
      isActive: true
    };

    this.usersTable.push(newUser);
    
    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  async login(email: string, passwordPlain: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<UserEntity, 'passwordHash'> }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.usersTable.find(u => u.email === normalizedEmail);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Authentication failed. Invalid email or inactive account.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Authentication failed. Invalid password credentials.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    // Generate JWT access & refresh tokens
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-2026',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-2026',
      expiresIn: '7d',
    });

    // Save refresh token key in Redis session cache (helps with instant remote logout audits)
    await this.redisService.set(`session:${user.id}:${refreshToken.slice(-10)}`, 'active', 7 * 24 * 3600);

    const { passwordHash: _, ...userSafe } = user;
    return { accessToken, refreshToken, user: userSafe };
  }

  async logout(userId: string, refreshToken: string, accessToken: string): Promise<void> {
    // Revoke the session in Redis
    await this.redisService.del(`session:${userId}:${refreshToken.slice(-10)}`);
    
    // Blacklist access token until expiry to protect against stale token replay attacks
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // standard access token validity duration
    await this.redisService.blacklistToken(accessToken, expiry);
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-2026',
      });

      const sessionActive = await this.redisService.get(`session:${payload.sub}:${refreshToken.slice(-10)}`);
      if (!sessionActive) {
        throw new UnauthorizedException('Session has been revoked or expired.');
      }

      // Check if user still exists
      const user = this.usersTable.find(u => u.id === payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User no longer exists or is disabled.');
      }

      // Clean old session
      await this.redisService.del(`session:${payload.sub}:${refreshToken.slice(-10)}`);

      // Generate rotated token pair
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-2026',
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-2026',
        expiresIn: '7d',
      });

      // Save new session in Redis
      await this.redisService.set(`session:${user.id}:${newRefreshToken.slice(-10)}`, 'active', 7 * 24 * 3600);

      return { accessToken, newRefreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired session refresh token.');
    }
  }

  async validateUserById(id: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = this.usersTable.find(u => u.id === id);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User invalid or inactive.');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
