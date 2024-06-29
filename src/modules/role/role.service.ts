import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleEntity } from "./entities/role.entity";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { AssignRoleToUserDto } from "./dto/assign-role-to-user.dto";
import { UserEntity } from "../users/entities/user.entity";

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(RoleEntity) 
        private readonly repository: Repository<RoleEntity>,
        private readonly usersService: UsersService,
    ) {}

    async assignRoleToUser(assignRoleToUserDto: AssignRoleToUserDto): Promise<void> {
        let user: UserEntity | null;
        if (assignRoleToUserDto.userId) {
            user = await this.usersService.getUserById(assignRoleToUserDto.userId);
        }

        const targetUser = await this.usersService.getUserById(assignRoleToUserDto.targetId);
    }
}