import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/modules/users/users.service';
import { UsersRepository } from 'src/modules/users/repository/users.repository';
import { UtilsService } from 'src/common/utils/utils';
import { RedisService } from 'src/modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { NotFoundException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Partial<UsersRepository>;
  let utils: Partial<UtilsService>;
  let redis: Partial<RedisService>;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    // Mock the repository and other dependencies
    repository = {
      getUserById: jest.fn().mockImplementation(id => Promise.resolve(
        id === 'existing-id' ? new UserEntity({ id: 'existing-id', email: 'test@example.com', username: 'testuser' }) : null
      )),
      getUserByEmail: jest.fn().mockImplementation(email => Promise.resolve(
        email === 'existing@example.com' ? new UserEntity({ id: 'existing-id', email, username: 'testuser' }) : null
      )),
      create: jest.fn().mockImplementation(user => Promise.resolve(user)),
      update: jest.fn().mockImplementation(user => Promise.resolve(user)),
      delete: jest.fn().mockImplementation(id => Promise.resolve()),
    };
    utils = {
      handleCommonErrors: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    configService = {
      get: jest.fn().mockImplementation(key => {
        if (key === 'REDIS_TTL') return 3600;
        if (key === 'HASH_SALT') return 10;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: UtilsService, useValue: utils },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      expect(await service.getUserById('existing-id')).toBeDefined();
    });

    it('should throw NotFoundException if user is not found', async () => {
      await expect(service.getUserById('non-existing-id')).rejects.toThrow(NotFoundException);
    });

    it('should validate input and throw UnprocessableEntityException for invalid input', async () => {
      await expect(service.getUserById('')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user if found', async () => {
        expect(await service.getUserByEmail('existing-id')).toBeDefined();
    });
  })

  describe('create', () => {
    it('should successfully create a user', async () => {
      const newUser = new UserEntity({ email: 'new@example.com', username: 'newuser', password: 'password123' });
      expect(await service.create({ email: 'new@example.com', username: 'newuser', password: 'password123' })).toEqual(newUser);
    });

    it('should throw BadRequestException if email already exists', async () => {
      await expect(service.create({ email: 'existing@example.com', username: 'testuser', password: 'password123' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        username: 'updateduser',
        password: 'newpassword,'
      };
      const updatedUser = await service.update('existing-id', updateUserDto);

      expect(updatedUser.email).toBe('updated@example.com');
      expect(updatedUser.username).toBe('updateduser');
      expect(repository.update).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`user:existing-id`);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValueOnce(null); // Simulate user not found
      await expect(service.update('non-existing-id', new UpdateUserDto()))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const cacheKey = `user:existing-id`;
      await service.delete('existing-id');
      expect(repository.delete).toHaveBeenCalledWith('existing-id');
      expect(redis.del).toHaveBeenCalledWith(cacheKey);
    });

    it('should throw NotFoundException if user does not exist before delete', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValueOnce(null); // Ensure user does not exist
      await expect(service.delete('non-existing-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
