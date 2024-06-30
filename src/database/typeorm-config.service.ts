import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get<string>('DATABASE_TYPE', { infer: true }),
      url: this.configService.get<string>('DATABASE_URL', { infer: true }),
      host: this.configService.get<string>('DATABASE_HOST', { infer: true }),
      port: this.configService.get<number>('DATABASE_PORT', { infer: true }),
      username: this.configService.get<string>('DATABASE_USERNAME', { infer: true }),
      password: this.configService.get<string>('DATABASE_PASSWORD', { infer: true }),
      database: this.configService.get<string>('DATABASE_NAME', { infer: true }),
      synchronize: this.configService.get('DATABASE_SYNCHRONIZE', {
        infer: true,
      }),
      dropSchema: false,
      keepConnectionAlive: true,
      logging: false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      cli: {
        entitiesDir: 'src',
        migrationsDir: 'src/database/migrations',
        subscribersDir: 'subscriber',
      },
      // extra: {
      //   // based on https://node-postgres.com/apis/pool
      //   // max connection pool size
      //   max: this.configService.get<string>('DATABASE_MAX_CONNECTIONS', { infer: true }),
      //   ssl: this.configService.get('DATABASE_SSL_ENABLED', { infer: true })
      //     ? {
      //         rejectUnauthorized: this.configService.get<string>(
      //           'DATABASE_REJECT_UNAUTHORIZED',
      //           { infer: true },
      //         ),
      //         ca:
      //           this.configService.get<string>('DATABASE_CA', { infer: true }) ??
      //           undefined,
      //         key:
      //           this.configService.get<string>('DATABASE_KEY', { infer: true }) ??
      //           undefined,
      //         cert:
      //           this.configService.get<string>('DATABASE_CERT', { infer: true }) ??
      //           undefined,
      //       }
      //     : undefined,
      // },
    } as TypeOrmModuleOptions;
  }
}