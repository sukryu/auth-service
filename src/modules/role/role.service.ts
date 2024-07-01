import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleEntity } from "./entities/role.entity";
import { Repository } from "typeorm";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RoleService {
    private readonly logger = new Logger(RoleService.name);

    constructor(
        @InjectRepository(RoleEntity) 
        private readonly repository: Repository<RoleEntity>
    ) {}

    async create(createRoleDto: CreateRoleDto, currentUserId: string): Promise<RoleEntity> {
        const existingRole = await this.repository.findOne({ where: { name: createRoleDto.name } });
        if (existingRole) {
            throw new ConflictException(`Role ${createRoleDto.name} already exists`);
        }

        const newRole = this.repository.create({
            ...createRoleDto,
            created_By: currentUserId
        });

        return this.repository.save(newRole);
    }

    async findAll(): Promise<RoleEntity[]> {
        return this.repository.find();
    }

    async findOne(id: number): Promise<RoleEntity> {
        const role = await this.repository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    async update(id: number, updateRoleDto: UpdateRoleDto, currentUserId: string): Promise<RoleEntity> {
        const role = await this.findOne(id);
        Object.assign(role, updateRoleDto);
        role.updated_By = currentUserId;
        return this.repository.save(role);
    }

    async remove(id: number, currentUserId: string): Promise<void> {
        const role = await this.findOne(id);
        role.deleted_By = currentUserId;
        await this.repository.softRemove(role);
    }

    isSuperAdmin(roles: string[]): boolean {
        return roles.includes('SUPERADMIN');
    }
}