import { EmailLoginResponseInterface } from "../interfaces/email-login-response.interface";

export class EmailLoginResponseDto implements EmailLoginResponseInterface {
    status: number;
    message: string;
    data?: any;
}