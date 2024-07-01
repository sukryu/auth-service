import { Role } from "src/common/enum/role.enum";

export interface AssignRoletoUserInterface {
    userId?: string;
    targetId: string;
    roleNames: Role[];
}