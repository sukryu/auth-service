import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany } from "typeorm";
import { UserEntity } from "src/modules/users/entities/user.entity";

@Entity({ name: 'roles' })
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ 
        type: 'varchar',
        unique: true
    })
    name: string;

    @CreateDateColumn()
    created_At: Date;

    @UpdateDateColumn()
    updated_At: Date;

    @DeleteDateColumn()
    deleted_At: Date;

    @Column({ type: 'uuid', nullable: true })
    created_By: string;

    @Column({ type: 'uuid', nullable: true })
    updated_By: string;

    @Column({ type: 'uuid', nullable: true })
    deleted_By: string;

    @ManyToMany(() => UserEntity, user => user.roles)
    users: UserEntity[];
}