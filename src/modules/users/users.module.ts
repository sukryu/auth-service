import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { RedisService } from "../redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { UtilsService } from "src/common/utils/utils";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { RoleModule } from "../role/role.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([ UserEntity ]),
        forwardRef(() => RoleModule),
    ],
    providers: [
        RedisService,
        ConfigService,
        UtilsService,
        UsersService,
    ],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}