import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { Redis } from 'ioredis';
import RedisStore from 'connect-redis';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableShutdownHooks();
  app.setGlobalPrefix('/api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const options = new DocumentBuilder()
    .setTitle('AuthServer - AuthService')
    .setDescription(
      'An API docs for Auth Server',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'jwt'
      }
    )
    .build();

  // Session

  const configService = app.get(ConfigService);
  
  const redisClient = new Redis(
    +configService.get<number>('REDIS_PORT'),
    configService.get<string>('REDIS_HOST'),
    { password: configService.get<string>('REDIS_PASSWORD') },
  );

  redisClient.on('error', (err) => {
    Logger.error(err);
  });
  redisClient.on('connect', () => {
    Logger.log(`Connection to redis established successfully`);
  });

  const redisStore = new RedisStore({ client: redisClient });

  app.use(
    session({
      store: redisStore,
      name: configService.get<string>('REDIS_AUTH_TOKEN_SESSION'),
      secret: configService.get<string>('REDIS_SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 60000,
        secure: configService.get<string>('NODE_ENV') === 'production',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  // -- Session

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  const port = app.get(ConfigService).get('APP_PORT', 9000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Application is running on : ${await app.getUrl()}`);
}
bootstrap();
