import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Connection Error:', err);
    });

    try {
      await this.client.connect();
      this.logger.log('Successfully connected to Redis cluster.');
    } catch (err) {
      this.logger.warn('Could not establish real Redis connection, falling back to in-memory mock client for local environment.');
      // Create a local in-memory fallback mock to prevent system crashing in local-only mock environments
      this.client = {
        get: async (key: string) => this.mockStore[key] || null,
        set: async (key: string, value: string, options?: any) => {
          this.mockStore[key] = value;
          return 'OK';
        },
        del: async (key: string) => {
          delete this.mockStore[key];
          return 1;
        },
        connect: async () => {},
        quit: async () => {},
      } as any;
    }
  }

  private mockStore: Record<string, string> = {};

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Token blacklisting for real-time JWT revocation
  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    const key = `blacklist:${token}`;
    const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await this.set(key, '1', ttl);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const val = await this.get(`blacklist:${token}`);
    return val !== null;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
