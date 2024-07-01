import { BadRequestException, HttpStatus, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { TokenService } from "./jwt/jwt.service";
import { ConfigService } from "@nestjs/config";
import { EmailLoginDto } from "./dto/email-login.dto";
import { JwtPayload } from "./jwt/dto/jwt.payload.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import * as bcrypt from 'bcrypt';
import { UserEntity } from "../users/entities/user.entity";
import { UtilsService } from "src/common/utils/utils";
import { JwtRevokeTokenPayloadDto } from "./jwt/dto/jwt-revoke-token.payload.dto";
import { SaveRevokedTokenDto } from "./dto/save-revoked-token.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UpdateUserDto } from "../users/dto/update-user.dto";

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
            status: HttpStatus.OK,
            message: 'Successfully logged in',
            data: {
                user,
                accessToken,
                refreshToken,
            },
        };
    }

    async logout(revokeJwtPayload: JwtRevokeTokenPayloadDto, ip: string): Promise<void> {
        const user = await this.users.getUserById(revokeJwtPayload.userId);
        await this.utils.handleCommonErrors(user);

        const saveRevokedTokenDto: SaveRevokedTokenDto = {
            revoked_token: revokeJwtPayload.token,
            revoked_token_type: revokeJwtPayload.tokenType,
            revoked_reason: 'logout',
            revoked_by_user_id: revokeJwtPayload.userId,
            revoked_from_ip: ip,
        }
        await this.token.revokeToken(saveRevokedTokenDto);
    }

    private async comparePassword(input: string, password: string): Promise<boolean> {
        return await bcrypt.compare(input, password);
    }

    async refreshToken(refreshToken: string) {
        try {
            // Validate the refresh token
            const payload = await this.token.validateToken(refreshToken, 'refresh');
            
            // Get the user
            const user = await this.users.getUserById(payload.sub);
            
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Generate new access token
            const newAccessToken = await this.token.generateAccessToken({
                sub: user.id,
                email: user.email,
                admin: false, // or however you determine admin status
            });

            const newRefreshToken = await this.token.generateRefreshToken({
                sub: user.id,
                email: user.email,
                admin: false,
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                },
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async register(createUserDto: CreateUserDto): Promise<UserEntity> {
        const existingUser = await this.users.getUserByEmail(createUserDto.email);
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = await this.users.create({
            ...createUserDto,
            password: hashedPassword,
        });

        return newUser;
    }

    async updateUser(userId: string, updateData: UpdateUserDto): Promise<UserEntity> {
        const user = await this.users.getUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        return this.users.update(userId, updateData);
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.users.getUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.users.delete(userId);
    }
}