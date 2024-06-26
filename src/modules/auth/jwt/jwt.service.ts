import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from "./dto/jwt.payload.dto";
import { JwtRevokeTokenPayloadDto } from "./dto/jwt-revoke-token.payload.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { RevokedTokenEntity } from "../entities/revoked.entity";
import { Repository } from "typeorm";
import { SaveRevokedTokenDto } from "../dto/save-revoked-token.dto";

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;

    constructor(
        @InjectRepository(RevokedTokenEntity)
        private readonly repo: Repository<RevokedTokenEntity>,
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

    public async saveRevokedToken(saveRevokedTokenDto: SaveRevokedTokenDto): Promise<RevokedTokenEntity> {
        if (await this.isTokenRevoked(saveRevokedTokenDto.revoked_token)) {
            this.logger.error(`This Token already revoked.`);
            throw new BadRequestException(`This Token already revoked.`);
        } else {
            const token = new RevokedTokenEntity({
                revoked_token: saveRevokedTokenDto.revoked_token,
                revoked_token_type: saveRevokedTokenDto.revoked_token_type,
                revoked_reason: saveRevokedTokenDto.revoked_reason,
                revoked_by_user_id: saveRevokedTokenDto.revoked_by_user_id,
                revoked_from_ip: saveRevokedTokenDto.revoked_from_ip,
            });

            const revokedToken = await this.repo.create(token);
            return await this.repo.save(revokedToken);
        }
    }

    public async revokeToken(saveRevokedTokenDto: SaveRevokedTokenDto): Promise<RevokedTokenEntity> {
        return await this.saveRevokedToken(saveRevokedTokenDto);
    }

    private async isTokenRevoked(token: string): Promise<boolean> {
        const found = await this.repo.findOne({ where: { revoked_token: token }});
        return !!found;
    }
}
