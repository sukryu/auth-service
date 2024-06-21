import { JwtPayloadInterface } from "../interfaces/jwt.payload";

export class JwtPayload implements JwtPayloadInterface {
    sub: string;
    email: string;
    admin: boolean;
    exp?: number;
    iat?: number;
}