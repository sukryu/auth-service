export interface JwtPayloadInterface {
    sub: string; // userID
    email: string;
    admin: boolean;
}