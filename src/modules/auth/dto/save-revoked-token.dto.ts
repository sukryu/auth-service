import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";
import { SaveRevokedTokenInterface } from "../interfaces/save-revoked-token.interface";
import { IsNotEmpty, IsString } from "class-validator";

export class SaveRevokedTokenDto implements SaveRevokedTokenInterface {
    
    @IsString()
    @IsNotEmpty()
    revoked_token: string;

    @IsString()
    @IsNotEmpty()
    revoked_token_type: RevokeTokenType;

    @IsString()
    @IsNotEmpty()
    revoked_reason: string;

    // Admin field
    revoked_by_user_id?: string;
    revoked_from_ip?: string;
    // -- Admin field
}