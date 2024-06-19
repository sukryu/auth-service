import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UserEntity } from "src/modules/users/entities/user.entity";

@Injectable()
export class UtilsService {
    private readonly logger = new Logger(UtilsService.name);
    constructor() {}

    public async handleCommonErrors(user: UserEntity): Promise<void> {
        if (!user) {
            this.logger.error(`user not found.`);
            throw new NotFoundException(`user not found`);
        }
        else if (user.deleted_At !== null) {
            this.logger.error(`This accounts has already been deleted.`);
            throw new BadRequestException(`This accounts has already been deleted.`);
        }
    }
}