import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RevokeTokenMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException(`Token was not provided`);
        }

        req.headers.authorization = `bearer ${token}`;

        req['token'] = token;
        next();
    }
}