import { EmailLoginResponseInterface } from "../interfaces/email-login-response.interface";

export class EmailLoginResponseDto implements EmailLoginResponseInterface {
    ok: boolean;
    message: string;
    data?: any;
}