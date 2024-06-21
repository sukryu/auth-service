import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { TokenService } from "./jwt/jwt.service";
import { ConfigService } from "@nestjs/config";
import { EmailLoginDto } from "./dto/email-login.dto";
import { JwtPayload } from "./jwt/dto/jwt.payload.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly users: UsersService,
        private readonly token: TokenService,
        private readonly config: ConfigService,
    ) {}
    
    async login(emailLoginDto: EmailLoginDto): Promise<EmailLoginResponseDto> {
        const user = await this.users.getUserByEmail(emailLoginDto.email);

        const isMatches = await this.comparePassword(user.password, emailLoginDto.password);
        if (!isMatches) {
            this.logger.error(`Invalid credentials`);
            throw new BadRequestException(`Invalid credentials`);
        }

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

    private async comparePassword(password: string, input: string): Promise<boolean> {
        return bcrypt.compare(password, input);
    }
}