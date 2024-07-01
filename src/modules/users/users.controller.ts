import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { APIResponseDto } from "src/common/dto/api-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RequestWithUser } from "src/common/interfaces/request-with-user.interface";

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1', path: 'users' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService
  ) {}

  @ApiQuery({ name: 'cursor', type: 'string', description: 'encrypted base64 created_At', required: false })
  @ApiQuery({ name: 'limit', type: 'number', description: 'limit of users number', required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated users', type: APIResponseDto })
  @Get('/pagination')
  @Roles('ADMIN', 'SUPERADMIN')
  async getUsers(@Query() paginationDto: CursorPaginationDto): Promise<APIResponseDto> {
    const users = await this.usersService.getUsersWithCursorPagination(paginationDto);
    return {
      status: HttpStatus.OK,
      message: 'Successfully fetched users.',
      data: users,
    };
  }

  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully fetched user', type: APIResponseDto })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user ID' })
  @Get('/:id')
  @Roles('ADMIN', 'SUPERADMIN')
  async getUserById(@Param('id') id: string): Promise<APIResponseDto> {
    if (typeof(id) !== 'string') {
      this.logger.error(`Invalid user ID: ${id}`);
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.usersService.getUserById(id);
    return {
      status: HttpStatus.OK,
      message: 'Successfully fetched user.',
      data: user,
    };
  }

  @ApiParam({ name: 'email', description: 'User Email' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully fetched user', type: APIResponseDto })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user email' })
  @Post('/email')
  @Roles('ADMIN', 'SUPERADMIN')
  async getUserByEmail(@Body('email') email: string): Promise<APIResponseDto> {
    if (typeof(email) !== 'string') {
      this.logger.error(`Invalid user email: ${email}`);
      throw new BadRequestException('Invalid user email');
    }
    const user = await this.usersService.getUserByEmail(email);
    if (user.deleted_At !== null) {
      throw new BadRequestException(`This account has already been deleted.`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Successfully fetched user.',
      data: user,
    };
  }

  @ApiCreatedResponse({ status: HttpStatus.CREATED, description: 'Successfully created user', type: APIResponseDto })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @Post('/create')
  @Roles('ADMIN', 'SUPERADMIN')
  async createUser(@Req() req: RequestWithUser, @Body() createUserDto: CreateUserDto): Promise<APIResponseDto> {
    const user = await this.usersService.create(createUserDto, req.user.id);
    return {
      status: HttpStatus.CREATED,
      message: 'Successfully created user.',
      data: user,
    }
  }

  @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully updated user', type: APIResponseDto })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found'})
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid userId or type'})
  @Patch('/:id')
  @Roles('ADMIN', 'SUPERADMIN')
  async updateUser(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<APIResponseDto> {
    const updatedUser = await this.usersService.update(id, updateUserDto, req.user.id);
    return {
      status: HttpStatus.OK,
      message: 'Successfully updated user.',
      data: updatedUser,
    };
  }

  @ApiNoContentResponse({ status: HttpStatus.NO_CONTENT, description: 'No Content to return'})
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found'})
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'invalid userId or type'})
  @Delete('/:id')
  @Roles('SUPERADMIN')
  async deleteUser(@Req() req: RequestWithUser, @Param('id') id: string): Promise<APIResponseDto> {
    await this.usersService.delete(id, req.user.id);
    return {
      status: HttpStatus.NO_CONTENT,
      message: 'Successfully deleted user.',
    };
  }
}