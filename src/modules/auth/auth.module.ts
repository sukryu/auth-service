import { Module } from "@nestjs/common";
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
export class AuthModule {}