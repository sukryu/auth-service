import { Injectable, NestMiddleware } from '@nestjs/common';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import { RedisService } from 'src/modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
) {}

  use(req: any, res: any, next: () => void) {
    const RedisStore = connectRedis(session);

    session({
      store: new RedisStore({ client: this.redisService.getClient() }),
      secret: this.configService.get<string>(''),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === this.configService.get<string>('NODE_ENV'),
        httpOnly: true,
        maxAge: 86400000 // 24 hours
      }
    })(req, res, next);
  }
}
