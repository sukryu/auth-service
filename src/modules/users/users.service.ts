import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnprocessableEntityException, BadRequestException, ForbiddenException, Inject, forwardRef } from "@nestjs/common";
import { UserServiceInterface } from "./interfaces/user-service.interface";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserEntity } from "./entities/user.entity";
import { UtilsService } from "src/common/utils/utils";
import { RedisService } from "../redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { plainToClass } from "class-transformer";
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from "./dto/update-user.dto";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { RoleService } from "../role/role.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Role } from "src/common/enum/role.enum";

@Injectable()
export class UsersService implements UserServiceInterface {
    private readonly logger = new Logger(UsersService.name);
    private readonly TTL = this.configService.get<number>('REDIS_TTL');
    private readonly salt = 10;

    constructor(
        @InjectRepository(UserEntity)
        public readonly repository: Repository<UserEntity>,
        private readonly utils: UtilsService,
        private readonly redis: RedisService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => RoleService))
        private readonly roleService: RoleService,
        private dataSource: DataSource
    ) {}

    public async getUsers(): Promise<UserEntity[]> {
        try {
            return await this.repository.find();
        } catch (error) {
            this.logger.error(`Failed to get users: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve users');
        }
    }

    public async getUsersWithCursorPagination(paginationDto: CursorPaginationDto): Promise<{ users: UserEntity[], nextCursor: string | null }> {
        try {
            const { cursor, limit } = paginationDto;

            const query = this.repository.createQueryBuilder("user")
                .orderBy("user.created_At", "DESC")
                .take(limit + 1);

            if (cursor) {
                const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
                query.where("user.created_At < :cursor", { cursor: new Date(decodedCursor) });
            }

            const users = await query.getMany();

            let nextCursor: string | null = null;
            if (users.length > limit) {
                const nextCursorUser = users.pop();
                nextCursor = Buffer.from(nextCursorUser.created_At.toISOString()).toString('base64');
            }

            return { users, nextCursor };
        } catch (error) {
            this.logger.error(`Failed to get users with pagination: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve paginated users');
        }
    }

    public async getUserById(userId: string): Promise<UserEntity> {
        if (typeof(userId) !== 'string') {
            throw new UnprocessableEntityException(`Invalid type or input for user ID: ${userId}`);
        }

        try {
            let user = await this.getCacheUser(`user:${userId}`);
            if (!user) {
                user = await this.repository.findOne({ where: { id: userId } });
                if (!user) {
                    throw new NotFoundException(`User not found with ID: ${userId}`);
                }
                await this.setCacheUser(user);
            }
            return user;
        } catch (error) {
            this.logger.error(`Failed to get user by ID: ${error.message}`);
            throw error;
        }
    }

    public async getUserByEmail(email: string): Promise<UserEntity> {
        if (typeof(email) !== 'string') {
            throw new UnprocessableEntityException(`Invalid type or input for email: ${email}`);
        }

        try {
            return await this.repository.findOne({ where: { email } });
        } catch (error) {
            this.logger.error(`Failed to get user by email: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve user by email');
        }
    }

    public async setCacheUser(user: UserEntity): Promise<void> {
        try {
            await this.utils.handleCommonErrors(user);
            const hashKey = `user:${user.id}`;
            await this.redis.set(hashKey, JSON.stringify(user), this.TTL);
        } catch (error) {
            this.logger.error(`Failed to set user cache: ${error.message}`);
            // Don't throw here, just log the error
        }
    }

    public async getCacheUser(key: string): Promise<UserEntity | null> {
        try {
            const cacheUser = await this.redis.get(key);
            if (!cacheUser) {
                return null;
            }
            return plainToClass(UserEntity, JSON.parse(cacheUser));
        } catch (error) {
            this.logger.error(`Failed to get user from cache: ${error.message}`);
            return null; // Return null instead of throwing, to fallback to database
        }
    }

    public async create(createUserDto: CreateUserDto, currentUserId?: string): Promise<UserEntity> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const isExists = await this.getUserByEmail(createUserDto.email);
            if (isExists) {
                throw new BadRequestException(`This email has already been used: ${createUserDto.email}`);
            }

            const user = new UserEntity({
                email: createUserDto.email,
                username: createUserDto.username,
                password: await this.hashPassword(createUserDto.password),
            });

            const newUser = await queryRunner.manager.save(UserEntity, user);

            // Assign default role (e.g., 'USER')
            await this.roleService.assignRoleToUser({
                targetId: newUser.id,
                roleName: Role.User,
            }, currentUserId, queryRunner.manager);

            await queryRunner.commitTransaction();

            await this.setCacheUser(newUser);
            return newUser;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create user: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    public async update(userId: string, updateUserDto: UpdateUserDto, currentUserId?: string): Promise<UserEntity> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let user = await this.getUserById(userId);

            if (currentUserId && currentUserId !== userId) {
                const currentUser = await this.getUserById(currentUserId);
                if (!this.roleService.canAssignRole(currentUser.roles, user.roles[0].name)) {
                    throw new ForbiddenException('You do not have permission to update this user');
                }
            }

            if (updateUserDto.email) user.email = updateUserDto.email;
            if (updateUserDto.username) user.username = updateUserDto.username;
            if (updateUserDto.password) user.password = await this.hashPassword(updateUserDto.password);

            if (updateUserDto.roleName) {
                for (const roleName of updateUserDto.roleName) {
                    await this.roleService.assignRoleToUser({
                        targetId: userId,
                        roleName
                    }, currentUserId, queryRunner.manager);
                }
            }

            const updatedUser = await queryRunner.manager.save(UserEntity, user);

            await queryRunner.commitTransaction();

            await this.invalidateUserCache(userId);
            await this.setCacheUser(updatedUser);
            return updatedUser;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to update user: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    public async delete(userId: string, currentUserId?: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await this.getUserById(userId);

            if (currentUserId && currentUserId !== userId) {
                const currentUser = await this.getUserById(currentUserId);
                if (!this.roleService.canAssignRole(currentUser.roles, user.roles[0].name)) {
                    throw new ForbiddenException('You do not have permission to delete this user');
                }
            }

            await queryRunner.manager.softDelete(UserEntity, userId);

            await queryRunner.commitTransaction();

            await this.invalidateUserCache(userId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to delete user: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async hashPassword(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, this.salt);
        } catch (error) {
            this.logger.error(`Failed to hash password: ${error.message}`);
            throw new InternalServerErrorException('Failed to process password');
        }
    }

    private async invalidateUserCache(userId: string): Promise<void> {
        try {
            await this.redis.del(`user:${userId}`);
        } catch (error) {
            this.logger.error(`Failed to invalidate user cache: ${error.message}`);
            // Don't throw here, just log the error
        }
    }
}