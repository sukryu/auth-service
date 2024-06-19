import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UserRepositoryInterface } from "../interfaces/user-repository.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import * as bcrypt from 'bcrypt';
import { UtilsService } from "src/common/utils/utils";

@Injectable()
export class UsersRepository implements UserRepositoryInterface {
    private readonly logger = new Logger(UsersRepository.name);
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
        private readonly utils: UtilsService,
    ) {}

    public async getUsers(): Promise<UserEntity[]> {
        return await this.repository.find();
    }

    public async getUserById(userId: string): Promise<UserEntity> {
        const user = await this.repository.findOne({ where: { id: userId }});
        await this.utils.handleCommonErrors(user);
        return user;
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

    public async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.repository.findOne({ where: { id: userId }});
        await this.utils.handleCommonErrors(user);

        if (updateUserDto.email) user.email = updateUserDto.email;
        if (updateUserDto.password) user.password = await this.hashPassword(updateUserDto.password);
        if (updateUserDto.username) user.username = updateUserDto.username;

        return await this.repository.save(user);
    }

    public async delete(userId: string): Promise<void> {
        const user = await this.repository.findOne({ where: { id: userId }});
        await this.utils.handleCommonErrors(user);

        await this.repository.softDelete(userId);
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }
}