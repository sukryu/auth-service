import { Role } from "src/common/enum/role.enum";

export interface UpdateUserDtoInterface {
    email?: string;
    username?: string;
    password?: string;
    roleName?: Role[];
}