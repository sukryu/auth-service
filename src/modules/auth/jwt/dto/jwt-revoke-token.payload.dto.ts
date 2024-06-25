import { JwtRevokeTokenPayloadInterface } from "../interfaces/jwt-revoke-token.payload.interface";

export class JwtRevokeTokenPayloadDto implements JwtRevokeTokenPayloadInterface {
    token: string;
    tokenType: 'AccessToken' | 'RefreshToken';
    userId: string;
}