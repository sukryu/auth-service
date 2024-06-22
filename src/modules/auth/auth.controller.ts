import { Body, Controller, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { EmailLoginDto } from "./dto/email-login.dto";
import { EmailLoginResponseDto } from "./dto/email-login-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";

@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
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
}