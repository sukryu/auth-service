import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { UserRepositoryInterface } from "../interfaces/user-repository.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dto/create-user.dto";
import { UtilsService } from "src/common/utils/utils";
import { RedisService } from "src/modules/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { plainToClass } from "class-transformer";

@Injectable()
export class UsersRepository implements UserRepositoryInterface {
    private readonly logger = new Logger(UsersRepository.name);
    private readonly TTL = this.configService.get<number>("REDIS_TTL");
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
        private readonly utils: UtilsService,
        private readonly redis: RedisService,
        private readonly configService: ConfigService,
    ) {}

    public async setCacheUser(user: UserEntity): Promise<void> {
        await this.utils.handleCommonErrors(user);
        const hashKey = `user:${user.id}`;
        await this.redis.set(hashKey, JSON.stringify(user), this.TTL);
    }

    public async getCacheUser(key: string): Promise<UserEntity> {
        const cacheUser = await this.redis.get(key);
        if (!cacheUser) {
            this.logger.error(`Cannot find cache user: ${key}`);
            throw new NotFoundException(`Cannot find cache user: ${key}`);
        }

        try {
            const user = plainToClass(UserEntity, JSON.parse(cacheUser));
            await this.utils.handleCommonErrors(user);
            return user;
        } catch (error) {
            this.logger.error(`Failed to parse user data from cache: ${error.message}`);
            throw new InternalServerErrorException(`Failed to parse user data from cache`);
        }
    }

    public async getUsers(): Promise<UserEntity[]> {
        return await this.repository.find();
    }

    public async getUserById(userId: string): Promise<UserEntity> {
        const cacheKey = `user:${userId}`;
        const cachedUser = await this.getCacheUser(cacheKey);
        if (cachedUser) {
            this.logger.debug(`Cache hit for user: ${userId}`);
            await this.utils.handleCommonErrors(cachedUser);
            return cachedUser;
        } else {
            this.logger.debug(`Cache miss for user: ${userId}`);
            const user = await this.repository.findOne({ where: { id: userId }});
            await this.utils.handleCommonErrors(user);
            await this.setCacheUser(user);
            return user;
        }
    }

    public async getUserByEmail(email: string): Promise<UserEntity> {
        const user = await this.repository.findOne({ where: { email }});
        await this.utils.handleCommonErrors(user);

        return user;
    }

    public async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        const user = await this.repository.create(createUserDto);
        return await this.repository.save(user);
    }

    public async update(user: UserEntity): Promise<UserEntity> {
        await this.utils.handleCommonErrors(user);

        const cacheKey = `user:${user.id}`;
        await this.redis.del(cacheKey);

        const updateUser = await this.repository.save(user);
        await this.setCacheUser(updateUser);
        return updateUser;
    }

    public async delete(userId: string): Promise<void> {
        const user = await this.repository.findOne({ where: { id: userId }});
        await this.utils.handleCommonErrors(user);

        await this.repository.softDelete(userId);
    }
}