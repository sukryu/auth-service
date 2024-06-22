import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from "./dto/jwt.payload.dto";

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;

    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) {
        this.accessTokenSecret = this.config.get<string>('ACCESS_TOKEN_SECRET');
        this.refreshTokenSecret = this.config.get<string>('REFRESH_TOKEN_SECRET');
    }

    public async validateToken(token: string, type: 'access' | 'refresh'): Promise<any> {
        const secret = type === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;
        try {
            return await this.jwt.verify(token, { secret });
        } catch (err) {
            this.logger.error(`Token validation failed: ${err.message}`);
            throw new BadRequestException(`Invalid token`);
        }
    }

    private async createToken(payload: JwtPayload, expiresIn: number, secret: string): Promise<string> {
        const options = {
            expiresIn,
            secret,
        };
        return await this.jwt.sign(payload, options);
    }

    public async generateAccessToken(payload: JwtPayload): Promise<string> {
        return await this.createToken(payload, 60 * 60, this.accessTokenSecret); // 1 hour
    }

    public async generateRefreshToken(payload: JwtPayload): Promise<string> {
        return await this.createToken(payload, 60 * 60 * 24 * 7, this.refreshTokenSecret); // 1 week
    }
}
