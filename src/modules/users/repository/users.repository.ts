import { Injectable, Logger } from "@nestjs/common";
import { UserRepositoryInterface } from "../interfaces/user-repository.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dto/create-user.dto";

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