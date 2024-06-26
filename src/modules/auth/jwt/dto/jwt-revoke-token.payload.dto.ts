import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";
import { JwtRevokeTokenPayloadInterface } from "../interfaces/jwt-revoke-token.payload.interface";

export class JwtRevokeTokenPayloadDto implements JwtRevokeTokenPayloadInterface {
    token: string;
    tokenType: RevokeTokenType;
    userId: string;
}