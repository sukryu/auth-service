import { ApiResponseInterface } from "../interfaces/api-response.interface";

export class APIResponseDto implements ApiResponseInterface {
    status: number;
    message: string;
    data?: any;
    error?: any;
}