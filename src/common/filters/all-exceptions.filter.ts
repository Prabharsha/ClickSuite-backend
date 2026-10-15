import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ApiErrorResponse } from "../interfaces/api-response.interface";

/**
 * Converts every thrown error into the standard error envelope:
 *   { success: false, message, error }
 *
 * - Preserves HttpException status codes and messages.
 * - Maps the HTTP status to a stable, machine-readable `error` code.
 * - Logs unexpected (non-HTTP) errors without leaking internals to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const maybeMessage = (res as Record<string, unknown>).message;
        if (Array.isArray(maybeMessage)) {
          message = maybeMessage.join(", ");
        } else if (typeof maybeMessage === "string") {
          message = maybeMessage;
        }
      }
      // Log *why* the request was rejected. The access log only records the
      // status code, which makes a 400 from the validation pipe indistinguishable
      // from any other — the reason has to be recoverable from the server logs.
      this.logger.warn(
        `${status} on ${request.method} ${request.url}: ${message}`,
      );
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Known DB errors → safe, mapped messages. Never leak the raw query/meta.
      ({ status, message } = this.mapPrismaError(exception));
      this.logger.warn(
        `Prisma error ${exception.code} on ${request.method} ${request.url}`,
      );
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Invalid database request";
      this.logger.warn(
        `Prisma validation error on ${request.method} ${request.url}`,
      );
    } else if (exception instanceof Error) {
      // Unexpected error — log the detail server-side, return a safe message.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      message,
      error: this.errorCode(status),
    };

    response.status(status).json(body);
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (error.code) {
      case "P2002":
        return {
          status: HttpStatus.CONFLICT,
          message: "Resource already exists",
        };
      case "P2025":
        return { status: HttpStatus.NOT_FOUND, message: "Resource not found" };
      case "P2003":
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Related resource does not exist",
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Database request error",
        };
    }
  }

  private errorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "UNPROCESSABLE_ENTITY";
      case HttpStatus.TOO_MANY_REQUESTS:
        return "TOO_MANY_REQUESTS";
      default:
        return status >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR";
    }
  }
}
