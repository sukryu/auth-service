import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";
import { CreateUserDtoInterface } from "../interfaces/create-user.interface";
import { NAME_REGEX, PASSWORD_REGEX } from "src/common/constants/regex";

export class CreateUserDto implements CreateUserDtoInterface {
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Matches(NAME_REGEX, {
        message: "문자열 시작과 끝 사이에 유니코드 문자, 숫자, 작은따옴표, 마침표, 공백만 포함할 수 있음."
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Matches(PASSWORD_REGEX, {
        message: "숫자 하나 이상 포함, 특수문자(공백 제외)가 하나 이상 포함, 문자열 시작 위치에 (.)이나 줄바꿈(\n)이 오지 않아야 함. 대문자 와 소문자 하나 이상 포함."
    })
    password: string;
}