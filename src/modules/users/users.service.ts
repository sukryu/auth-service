import { Injectable } from "@nestjs/common";
import { UserServiceInterface } from "./interfaces/user-service.interface";

@Injectable()
export class UsersService implements UserServiceInterface {
    constructor() {}
}