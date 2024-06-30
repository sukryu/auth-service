import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleEntity } from "./entities/role.entity";
import { EntityManager, Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { AssignRoleToUserDto } from "./dto/assign-role-to-user.dto";
import { UserEntity } from "../users/entities/user.entity";
import { Role } from "src/common/enum/role.enum";
import { ROLE_HIERARCHY } from "src/common/constants/role-hierarchy.constants";

@Injectable()
export class RoleService {
    private readonly logger = new Logger(RoleService.name);
    constructor(
        @InjectRepository(RoleEntity) 
        private readonly repository: Repository<RoleEntity>,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    async assignRoleToUser(assignRoleToUserDto: AssignRoleToUserDto, currentUserId?: string, entityManager?: EntityManager): Promise<void> {
        const repo = entityManager ? entityManager.getRepository(RoleEntity) : this.repository;
        const userRepo = entityManager ? entityManager.getRepository(UserEntity) : this.usersService.repository;

        try {
            const targetUser = await userRepo.findOne({ where: { id: assignRoleToUserDto.targetId }, relations: ['roles'] });
            if (!targetUser) {
                throw new NotFoundException(`Target user not found.`);
            }

            const newRole = await repo.findOne({ where: { name: assignRoleToUserDto.roleName }});
            if (!newRole) {
                throw new NotFoundException(`Role ${assignRoleToUserDto.roleName} not found`);
            }

            if (currentUserId && currentUserId !== assignRoleToUserDto.targetId) {
                const currentUser = await userRepo.findOne({ where: { id: currentUserId }, relations: ['roles'] });
                if (!currentUser) {
                    throw new NotFoundException(`Current user not found`);
                }
                if (!this.canAssignRole(currentUser.roles, newRole.name)) {
                    throw new ForbiddenException(`You do not have permission to assign this role`);
                }
            }

            if (!targetUser.roles) {
                targetUser.roles = [];
            }
            targetUser.roles.push(newRole);
            await userRepo.save(targetUser);
        } catch (error) {
            this.logger.error(`Failed to assign role to user: ${error.message}`);
            throw error;
        }
    }

    canAssignRole(currentUserRoles: RoleEntity[], roleToAssign: Role): boolean {
        const highestRole = this.getHighestRole(currentUserRoles);
        return ROLE_HIERARCHY[highestRole]?.includes(roleToAssign) || false;
    }

    getHighestRole(roles: RoleEntity[]): Role {
        const roleOrder = [Role.SuperAdmin, Role.Admin, Role.User, Role.Company];
        for (const role of roleOrder) {
            if (roles.some(r => r.name === role)) {
                return role;
            }
        }
        return Role.User;
    }
}