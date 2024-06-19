import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'users'
})
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', nullable: false, unique: true })
    email: string;

    @Column({ type: 'varchar', nullable: false, length: 20 })
    username: string;

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