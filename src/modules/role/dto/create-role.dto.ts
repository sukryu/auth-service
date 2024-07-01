import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
    @ApiProperty({ description: 'The name of the role' })
    @IsString()
    @IsNotEmpty()
    name: string;
}