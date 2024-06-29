import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor() {
        super();
    }

    handleRequest(err, user, info, context) {
        if (err || !user) {
            throw err || new UnauthorizedException(`Invalid credentials`);
        }
        return user;
    }
}
