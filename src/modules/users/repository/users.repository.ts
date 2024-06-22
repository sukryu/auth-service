import { Injectable, Logger } from "@nestjs/common";
import { UserRepositoryInterface } from "../interfaces/user-repository.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dto/create-user.dto";
import { CursorPaginationDto } from "../dto/cursor-pagination.dto";

@Injectable()
export class UsersRepository implements UserRepositoryInterface {
    private readonly logger = new Logger(UsersRepository.name);
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
    ) {}

    public async getUsers(): Promise<UserEntity[]> {
        return await this.repository.find();
    }

    public async getUsersWithCursorPagination(paginationDto: CursorPaginationDto): Promise<{ users: UserEntity[], nextCursor: string | null }> {
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

        return {
            users,
            nextCursor,
        }
    }

    public async getUserById(userId: string): Promise<UserEntity> {
        return await this.repository.findOne({ where: { id: userId }});
    }

    public async getUserByEmail(email: string): Promise<UserEntity> {
        const user = await this.repository.findOne({ where: { email }});
        return user;
    }

    public async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        const user = await this.repository.create(createUserDto);
        return await this.repository.save(user);
    }

    public async update(user: UserEntity): Promise<UserEntity> {
        return await this.repository.save(user);
    }

    public async delete(userId: string): Promise<void> {
        await this.repository.softDelete(userId);
    }
}