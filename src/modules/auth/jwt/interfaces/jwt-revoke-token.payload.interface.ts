export interface JwtRevokeTokenPayloadInterface {
    token: string;
    tokenType: string;
    userId: string;
}