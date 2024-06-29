import { AssignRoletoUserInterface } from "../interfaces/assign-role-to-user.interface";

export class AssignRoleToUserDto implements AssignRoletoUserInterface {
    userId?: string;
    targetId: string;
    roleName: string;
}