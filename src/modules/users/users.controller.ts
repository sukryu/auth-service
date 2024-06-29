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
  } from "@nestjs/common";
  import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
  } from "@nestjs/swagger";
  import { UsersService } from "./users.service";
  import { UserEntity } from "./entities/user.entity";
  import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { APIResponseDto } from "src/common/dto/api-response.dto";
  
  @ApiTags('users')
  @Controller({ version: '1', path: 'users' })
  export class UsersController {
    private readonly logger = new Logger(UsersController.name);
  
    constructor(
      private readonly usersService: UsersService
    ) {}

    @ApiQuery({ name: 'cursor', type: 'string', description: 'encrypted base64 created_At', required: false })
    @ApiQuery({ name: 'limit', type: 'number', description: 'limit of users number', required: false })
    @ApiResponse({ status: 200, description: 'Returns paginated users', type: [UserEntity] })
    @Get('/pagination')
    async getUsers(@Query() paginationDto: CursorPaginationDto): Promise<APIResponseDto> {
      const users = await this.usersService.getUsersWithCursorPagination(paginationDto);
      return {
        status: HttpStatus.OK,
        message: 'Successfully fetched user.',
        data: users,
      };
    }
  
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully fetched user', type: UserEntity })
    @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user ID' })
    @Get('/:id')
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
    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully fetched user', type: UserEntity })
    @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user email' })
    @Post('/email')
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
  
    @ApiCreatedResponse({ status: HttpStatus.CREATED, description: 'Successfully created user', type: UserEntity })
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
    @Post('/create')
    async createUser(@Req() req, @Body() createUserDto: CreateUserDto): Promise<APIResponseDto> {
      const user = await this.usersService.create(createUserDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Successfully created user.',
        data: user,
      }
    }

    @ApiOkResponse({ status: HttpStatus.OK, description: 'Successfully updated user', type: UserEntity })
    @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found'})
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid userId or type'})
    @Patch('/:id')
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserEntity> {
        return await this.usersService.update(id, updateUserDto);
    }

    @ApiNoContentResponse({ status: HttpStatus.NO_CONTENT, description: 'No Content to return'})
    @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found'})
    @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: 'invalid userId or type'})
    @Delete('/:id')
    async deleteUser(@Param('id') id: string): Promise<void> {
        await this.usersService.delete(id);
    }
  }