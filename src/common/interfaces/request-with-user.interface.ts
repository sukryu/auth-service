import { Request } from 'express';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export interface RequestWithUser extends Request {
  user: UserEntity;
}