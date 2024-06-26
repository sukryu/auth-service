import { Body, Controller, HttpStatus, Logger, Post, Req, Request, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { EmailLoginDto } from "./dto/email-login.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRevokeTokenPayloadDto } from "./jwt/dto/jwt-revoke-token.payload.dto";
import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";

@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(
        private readonly authService: AuthService,
    ) {}

    @UseGuards(LocalAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully logged in'})
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid credentials'})
    @Post('login')
    async login(@Req() req, @Body() emailLoginDto: EmailLoginDto): Promise<EmailLoginResponseDto> {
        return await this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully logged out'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'failed to authorization'})
    @Post('logout')
    async logout(@Req() req) {
        const token = req['token'];
        const user = req.user;

        await this.logger.debug(`
            token: ${token}\n
            userId: ${user.id}\n
        `)

        const payload: JwtRevokeTokenPayloadDto = {
            token,
            tokenType: RevokeTokenType.AccessToken,
            userId: user.id
        }

        await this.authService.logout(payload, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully revoked AccessToken'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'failed to authorization'})
    @Post('/revoke/access-token')
    async revokeAccessToken(@Request() req) {
        const token = req['token'];
        const user = req.user;

        const payload: JwtRevokeTokenPayloadDto = {
            token,
            tokenType: RevokeTokenType.AccessToken,
            userId: user.id
        }

        await this.authService.logout(payload, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully revoked RefreshToken'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'failed to authorization'})
    @Post('/revoke/refresh-token')
    async revokeRefreshToken(@Request() req) {
        const token = req['token'];
        const user = req.user;

        const payload: JwtRevokeTokenPayloadDto = {
            token,
            tokenType: RevokeTokenType.RefreshToken,
            userId: user.id
        }

        await this.authService.logout(payload, req.ip);
    }
}