import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";

export interface SaveRevokedTokenInterface {
    revoked_token: string;
    revoked_token_type: RevokeTokenType;
    revoked_reason: string;
    
    // Admin field
    revoked_by_user_id?: string;
    revoked_from_ip?: string;
    // -- Admin field
}