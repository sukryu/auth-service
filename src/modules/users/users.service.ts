import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnprocessableEntityException, BadRequestException } from "@nestjs/common";
import { UserServiceInterface } from "./interfaces/user-service.interface";
import { UsersRepository } from "./repository/users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserEntity } from "./entities/user.entity";
import { UtilsService } from "src/common/utils/utils";
import { RedisService } from "../redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { plainToClass } from "class-transformer";
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService implements UserServiceInterface {
    private readonly logger = new Logger(UsersService.name);
    private readonly TTL = this.configService.get<number>('REDIS_TTL');
    private readonly salt = 10;

    constructor(
        private readonly repository: UsersRepository,
        private readonly utils: UtilsService,
        private readonly redis: RedisService,
        private readonly configService: ConfigService,
    ) {}

    public async getUsers(): Promise<UserEntity[]> {
        return await this.repository.getUsers();
    }

    public async getUserById(userId: string): Promise<UserEntity> {
        if (typeof(userId) !== 'string') {
            throw new UnprocessableEntityException(`Invalid type or input for user ID: ${userId}`);
        }

        let user = await this.getCacheUser(`user:${userId}`);
        if (!user) {
            user = await this.repository.getUserById(userId);
            if (!user) {
                throw new NotFoundException(`User not found with ID: ${userId}`);
            }
            await this.setCacheUser(user);
        }
        return user;
    }

    public async getUserByEmail(email: string): Promise<UserEntity> {
        if (typeof(email) !== 'string') {
            throw new UnprocessableEntityException(`Invalid type or input for email: ${email}`);
        }

        return await this.repository.getUserByEmail(email);
    }

    public async setCacheUser(user: UserEntity): Promise<void> {
        await this.utils.handleCommonErrors(user);
        const hashKey = `user:${user.id}`;
        await this.redis.set(hashKey, JSON.stringify(user), this.TTL);
    }

    public async getCacheUser(key: string): Promise<UserEntity> {
        const cacheUser = await this.redis.get(key);
        if (!cacheUser) {
            return null; // Return null to indicate cache miss
        }

        try {
            return plainToClass(UserEntity, JSON.parse(cacheUser));
        } catch (error) {
            this.logger.error(`Failed to parse user data from cache: ${error.message}`);
            throw new InternalServerErrorException(`Failed to parse user data from cache`);
        }
    }

    public async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        const isExists = await this.getUserByEmail(createUserDto.email);
        if (isExists) {
            throw new BadRequestException(`This email has already been used: ${createUserDto.email}`);
        }

        const user = new UserEntity({
            email: createUserDto.email,
            username: createUserDto.username,
            password: await this.hashPassword(createUserDto.password),
        });

        const newUser = await this.repository.create(user);

        await this.setCacheUser(newUser);
        return newUser;
    }

    public async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        let user = await this.getCacheUser(`user:${userId}`);
        if (!user) {
            user = await this.getUserById(userId);
            if (!user) {
                throw new NotFoundException(`User not found with ID: ${userId}`);
            }
        }

        if (updateUserDto.email) user.email = updateUserDto.email;
        if (updateUserDto.username) user.username = updateUserDto.username;
        if (updateUserDto.password) user.password = await this.hashPassword(updateUserDto.password);

        const updatedUser = await this.repository.update(user);
        await this.redis.del(`user:${userId}`);

        await this.setCacheUser(updatedUser);
        return updatedUser;
    }

    public async delete(userId: string): Promise<void> {
        await this.redis.del(`user:${userId}`);
        await this.repository.delete(userId);
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.salt);
    }
}
