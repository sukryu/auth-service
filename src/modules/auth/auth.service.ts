import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { TokenService } from "./jwt/jwt.service";
import { ConfigService } from "@nestjs/config";
import { EmailLoginDto } from "./dto/email-login.dto";
import { JwtPayload } from "./jwt/dto/jwt.payload.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import * as bcrypt from 'bcrypt';
import { UserEntity } from "../users/entities/user.entity";
import { UtilsService } from "src/common/utils/utils";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly users: UsersService,
        private readonly token: TokenService,
        private readonly config: ConfigService,
        private readonly utils: UtilsService,
    ) {}

    async validateUserById(userId: string): Promise<UserEntity> {
        const user = await this.users.getUserById(userId);
        await this.utils.handleCommonErrors(user);
        return user;
    }

    async validateUser(emailLoginDto: EmailLoginDto): Promise<UserEntity> {
        const user = await this.users.getUserByEmail(emailLoginDto.email);
        await this.utils.handleCommonErrors(user);
        const isMatches = await this.comparePassword(emailLoginDto.password, user.password);
        if (!isMatches) {
            this.logger.error(`Invalid credentials`);
            throw new BadRequestException(`Invalid credentials`);
        }
        return user;
    }
    
    async login(user: UserEntity): Promise<EmailLoginResponseDto> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            admin: false,
        };
        const accessToken = await this.token.generateAccessToken(payload);
        const refreshToken = await this.token.generateRefreshToken(payload);

        return {
            ok: true,
            message: 'Successfully logged in',
            data: {
                user,
                accessToken,
                refreshToken,
            },
        };
    }

    async logout(userId: string): Promise<void> {
        const user = await this.users.getUserById(userId);
        await this.utils.handleCommonErrors(user);
        await this.token.
    }

    private async comparePassword(input: string, password: string): Promise<boolean> {
        return await bcrypt.compare(input, password);
    }
}