import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";
import { EmailLoginInterface } from "../interfaces/email-login.interface";
import { PASSWORD_REGEX } from "src/common/constants/regex";
import { ApiProperty } from "@nestjs/swagger";

export class EmailLoginDto implements EmailLoginInterface {
    @ApiProperty({ name: 'email', type: 'string', description: 'An email to login', example: 'test123@test.com'})
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({ name: 'password', type: 'string', description: 'An password to login', example: 'Test123!!@'})
    @IsString()
    @IsNotEmpty()
    @Matches(PASSWORD_REGEX, {
        message: "숫자 하나 이상 포함, 특수문자(공백 제외)가 하나 이상 포함, 문자열 시작 위치에 (.)이나 줄바꿈(\n)이 오지 않아야 함. 대문자 와 소문자 하나 이상 포함."
    })
    password: string;
}