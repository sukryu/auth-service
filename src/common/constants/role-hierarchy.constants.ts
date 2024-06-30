import { Role } from "../enum/role.enum";

export const ROLE_HIERARCHY = {
    [Role.SuperAdmin]: [Role.Admin, Role.User, Role.Company],
    [Role.Admin]: [Role.User, Role.Company],
    [Role.User]: [],
    [Role.Company]: [],
};