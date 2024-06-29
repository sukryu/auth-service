import { Body, Controller, Get, HttpStatus, Logger, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { EmailLoginDto } from "./dto/email-login.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";
import { APIResponseDto } from "src/common/dto/api-response.dto";
import { Request, Response } from "express";

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

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: `Successfully validate user.`})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: `Failed to authorization about accessToken`})
    @Post('me')
    async me(@Req() req): Promise<APIResponseDto> {
        return {
            status: HttpStatus.OK,
            message: 'Success',
            data: req.user,
        };
    }

    @UseGuards(LocalAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully logged in'})
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid credentials'})
    @Post('login')
    async login(@Req() req, @Body() emailLoginDto: EmailLoginDto, @Res({ passthrough: true }) response: Response): Promise<EmailLoginResponseDto> {
        const data = await this.authService.login(req.user);

        response.cookie(`access-token`, data.data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15M
        });

        response.cookie(`refresh-token`, data.data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 1000 // 7D
        });

        return {
            status: HttpStatus.OK,
            message: 'Login Success',
        };
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully logged out'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Failed to authorize'})
    @Post('logout')
    async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
        const accessToken = req.cookies['access-token'];
        const refreshToken = req.cookies['refresh-token'];
        const user = req.user;

        await this.authService.logout({
            token: accessToken,
            tokenType: RevokeTokenType.AccessToken,
            userId: user['id']
        }, req.ip);

        await this.authService.logout({
            token: refreshToken,
            tokenType: RevokeTokenType.RefreshToken,
            userId: user['id']
        }, req.ip);

        res.clearCookie('access-token');
        res.clearCookie('refresh-token');

        return { status: HttpStatus.OK, message: 'Successfully logged out' };
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully revoked AccessToken'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Failed to authorize'})
    @Post('/revoke/access-token')
    async revokeAccessToken(@Req() req, @Res({ passthrough: true }) res: Response) {
        const accessToken = req.cookies['access-token'];
        const user = req.user;

        await this.authService.logout({
            token: accessToken,
            tokenType: RevokeTokenType.AccessToken,
            userId: user['id']
        }, req.ip);

        res.clearCookie('access-token');

        return { status: HttpStatus.OK, message: 'Successfully revoked AccessToken' };
    }

    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully revoked RefreshToken'})
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Failed to authorize'})
    @Post('/revoke/refresh-token')
    async revokeRefreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh-token'];
        const user = req.user;

        await this.authService.logout({
            token: refreshToken,
            tokenType: RevokeTokenType.RefreshToken,
            userId: user['id']
        }, req.ip);

        res.clearCookie('refresh-token');

        return { status: HttpStatus.OK, message: 'Successfully revoked RefreshToken' };
    }

    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully refreshed token' })
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid refresh token' })
    @Post('refresh-token')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<APIResponseDto> {
        const refreshToken = req.cookies['refresh-token'];
        
        if (!refreshToken) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: 'Refresh token not found',
            };
        }

        try {
            const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.refreshToken(refreshToken);

            // Set new access token in cookie
            res.cookie('access-token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            // Set new refresh token in cookie (optional, depending on your refresh strategy)
            if (newRefreshToken) {
                res.cookie('refresh-token', newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                });
            }

            return {
                status: HttpStatus.OK,
                message: 'Token refreshed successfully',
                data: { user }
            };
        } catch (error) {
            this.logger.error(`Failed to refresh token: ${error.message}`);
            return {
                status: HttpStatus.UNAUTHORIZED,
                message: 'Failed to refresh token',
            };
        }
    }
}