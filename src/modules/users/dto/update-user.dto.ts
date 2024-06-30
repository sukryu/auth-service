import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { NAME_REGEX, PASSWORD_REGEX } from "src/common/constants/regex";
import { UpdateUserDtoInterface } from "../interfaces/update-user.interface";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/common/enum/role.enum";

export class UpdateUserDto implements UpdateUserDtoInterface {
    @ApiProperty({ name: 'email', type: 'string', description: 'user email', nullable: true, example: 'test123@test.com' })
    @IsEmail()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty({ name: 'username', type: 'string', description: 'The string can only contain Unicode characters, numbers, single quotes, periods, and spaces between the beginning and end.', nullable: true, example: 'test user'})
    @IsString()
    @IsOptional()
    @Matches(NAME_REGEX, {
        message: "문자열 시작과 끝 사이에 유니코드 문자, 숫자, 작은따옴표, 마침표, 공백만 포함할 수 있음."
    })
    username?: string;

    @ApiProperty({ name: 'password', type: 'string', description: 'Must contain at least one number, must contain at least one special character (excluding spaces), and must not contain a (.) or line break (\n) at the beginning of the string. Contains at least one uppercase and one lowercase letter.', nullable: true, example: 'Test123!!@'})
    @IsString()
    @IsOptional()
    @Matches(PASSWORD_REGEX, {
        message: "숫자 하나 이상 포함, 특수문자(공백 제외)가 하나 이상 포함, 문자열 시작 위치에 (.)이나 줄바꿈(\n)이 오지 않아야 함. 대문자 와 소문자 하나 이상 포함."
    })
    password?: string;

    roleName?: Role[];
}