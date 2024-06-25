import { RevokeTokenType } from "src/common/enum/revoke_toke-type.enum";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'revoked_token'
})
export class RevokedTokenEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', nullable: false, unique: true })
    revoked_token: string;

    @Column({ enum: RevokeTokenType, nullable: false })
    revoked_token_type: string;

    @Column({ type: 'varchar', nullable: false })
    revoked_reason: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    revoked_at: Date;

    // Admin field
    @Column({ type: 'uuid', nullable: true })
    revoked_by_user_id?: string;

    @Column({ type: 'varchar', nullable: true })
    revoked_from_ip?: string;
    // -- Admin field

    constructor(data?: Partial<RevokedTokenEntity>) {
        Object.assign(this, data);
    }
}