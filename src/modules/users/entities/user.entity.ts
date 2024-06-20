import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'users'
})
export class UserEntity {
    @ApiProperty({ name: 'userId', type: 'string', description: 'User ID', uniqueItems: true })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ name: 'email', type: 'string', description: 'User email', uniqueItems: true, nullable: false })
    @Index()
    @Column({ type: 'varchar', nullable: false, unique: true })
    email: string;

    @ApiProperty({ name: 'username', type: 'string', description: 'username & Max length 20', nullable: false})
    @Column({ type: 'varchar', nullable: false, length: 20 })
    username: string;

    @ApiProperty({ name: 'password', type: 'string', description: 'user password & hashing by bcrypt', nullable: false })
    @Column({ type: 'varchar', nullable: false })
    password: string;

    // Accounts field

    @CreateDateColumn()
    created_At: Date;

    @UpdateDateColumn()
    updated_At: Date;

    @DeleteDateColumn()
    deleted_At: Date;

    constructor(data?: Partial<UserEntity>) {
        Object.assign(this, data);
    }
}