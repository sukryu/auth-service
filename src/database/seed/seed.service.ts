import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RoleEntity } from 'src/modules/role/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async seed() {
    // Create SUPERADMIN role if it doesn't exist
    let superadminRole = await this.roleRepository.findOne({ where: { name: 'SUPERADMIN' } });
    if (!superadminRole) {
      superadminRole = this.roleRepository.create({ name: 'SUPERADMIN' });
      await this.roleRepository.save(superadminRole);
    }

    // Create SUPERADMIN user if it doesn't exist
    const superadminEmail = 'superadmin@admin.com';
    let superadminUser = await this.userRepository.findOne({ where: { email: superadminEmail } });
    if (!superadminUser) {
      const hashedPassword = await bcrypt.hash('SuperAdmin123!!@', 10);
      superadminUser = this.userRepository.create({
        email: superadminEmail,
        username: 'SuperAdmin',
        password: hashedPassword,
        roles: [superadminRole],
      });
      await this.userRepository.save(superadminUser);
    }

    console.log('Seed completed: SUPERADMIN role and user created.');
  }
}