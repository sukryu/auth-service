import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany } from "typeorm";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { Role } from "src/common/enum/role.enum";

@Entity({
    name: 'roles'
})
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ 
        type: 'enum', 
        enum: Role, 
        unique: true 
    })
    name: Role;

    @ManyToMany(() => UserEntity, user => user.roles)
    users: UserEntity[];

    @CreateDateColumn()
    created_At: Date;

    @UpdateDateColumn()
    updated_At: Date;

    @DeleteDateColumn()
    deleted_At: Date;

    @Column({ type: 'uuid', nullable: true })
    created_By: string;

    @Column({ type: 'uuid', nullable: true })
    deleted_By: string;
}