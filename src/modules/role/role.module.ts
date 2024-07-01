import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleEntity } from "./entities/role.entity";
import { UsersService } from "../users/users.service";
import { RoleService } from "./role.service";
import { UsersModule } from "../users/users.module";
import { RoleController } from "./role.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([RoleEntity]),
        forwardRef(() => UsersModule),
    ],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {}