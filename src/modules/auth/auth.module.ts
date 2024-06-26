import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { TokenService } from "./jwt/jwt.service";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./strategies/local.strategy";
import { UtilsService } from "src/common/utils/utils";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RevokedTokenEntity } from "./entities/revoked.entity";
import { RevokeTokenMiddleware } from "src/common/middlewares/revoke-token.middleware";

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>("ACCESS_TOKEN_SECRET"),
                signOptions: { expiresIn: '60m'},
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([RevokedTokenEntity]),
        UsersModule,
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        JwtStrategy,
        LocalStrategy,
        JwtAuthGuard,
        LocalAuthGuard,
        UtilsService,
    ],
    exports: [AuthService],
})
export class AuthModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RevokeTokenMiddleware)
            .forRoutes(
                { path: 'logout', method: RequestMethod.POST },
                { path: 'revoke/access-token', method: RequestMethod.POST },
                { path: 'revoke/refresh-token', method: RequestMethod.POST },
            )
    }
}