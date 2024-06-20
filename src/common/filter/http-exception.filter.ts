import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    let stack = '';
    if (exception instanceof Error) {
      stack = exception.stack || '';
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception instanceof HttpException ? exception.getResponse() : 'Internal server error',
      stackTrace: stack
    };

    this.logger.error(
      `[${request.method}] ${request.url} - ${responseBody.message}`,
      `Status: ${status}, Error: ${JSON.stringify(responseBody, null, 2)}`
    );

    if (!response.headersSent) {
      response.status(status).json(responseBody);
    }
  }
}
