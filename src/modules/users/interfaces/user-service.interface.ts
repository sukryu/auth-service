import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserEntity } from "../entities/user.entity";

export interface UserServiceInterface {
    create(createUserDto: CreateUserDto): Promise<UserEntity>;
    update(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity>;
    delete(userId: string): Promise<void>;

    getUsers(): Promise<UserEntity[]>;
    getUserById(userId: string): Promise<UserEntity>;
    getUserByEmail(email: string): Promise<UserEntity>;
}