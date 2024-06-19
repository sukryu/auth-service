import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    });
  }

  public async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  public async set(key: string, value: string, expiresIn?: number): Promise<void> {
    if (expiresIn) {
      await this.redis.set(key, value, 'EX', expiresIn);
    } else {
      await this.redis.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}