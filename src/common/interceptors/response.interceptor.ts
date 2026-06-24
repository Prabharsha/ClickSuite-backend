import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { RESPONSE_MESSAGE_KEY } from "../decorators/response-message.decorator";
import {
  ApiResponse,
  isPaginatedResult,
} from "../interfaces/api-response.interface";

/**
 * Wraps every successful handler return value in the standard envelope:
 *   { success, message, data, pagination? }
 *
 * - A `@ResponseMessage('...')` decorator sets the message (defaults to "Success").
 * - When a handler returns a PaginatedResult ({ data, pagination }), the
 *   pagination metadata is hoisted to the top level.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? "Success";

    return next.handle().pipe(
      map((payload): ApiResponse<T> => {
        if (isPaginatedResult(payload)) {
          return {
            success: true,
            message,
            data: payload.data as T,
            pagination: payload.pagination,
          };
        }

        return { success: true, message, data: payload };
      }),
    );
  }
}
