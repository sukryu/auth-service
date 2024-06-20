import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisOptions: RedisOptions = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
    };

    this.redis = new Redis(redisOptions);
    this.redis.on('connect', () => this.logger.log('Connected to Redis'));
    this.redis.on('error', (err) => this.logger.error('Redis connection error', err));
  }

  onModuleInit(): Promise<void> {
    return this.redis.ping()
      .then(() => this.logger.log('Redis client ready'))
      .catch(err => {
        this.logger.error('Failed to initialize Redis', err);
        throw err;
      });
  }

  onModuleDestroy(): Promise<void> {
    return this.redis.quit()
      .then(() => this.logger.log('Redis client disconnected'))
      .catch(err => this.logger.error('Error on Redis disconnect', err));
  }

  public getClient(): Redis {
    return this.redis;
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.error(`Failed to get key ${key} from Redis`, err);
      throw err;
    }
  }

  public async set(key: string, value: string, expiresIn?: number): Promise<void> {
    try {
      if (expiresIn) {
        await this.redis.set(key, value, 'EX', expiresIn);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Failed to set key ${key} in Redis`, err);
      throw err;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(`Failed to delete key ${key} from Redis`, err);
      throw err;
    }
  }
}