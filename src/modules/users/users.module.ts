import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { UsersRepository } from "./repository/users.repository";
import { RedisService } from "../redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { UtilsService } from "src/common/utils/utils";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([ UserEntity ]),
    ],
    providers: [
        UsersRepository, 
        RedisService, 
        ConfigService, 
        UtilsService,
        UsersService
    ],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}