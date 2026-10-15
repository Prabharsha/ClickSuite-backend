import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationMeta } from "../interfaces/api-response.interface";

/**
 * Upper bound on `limit` for every paginated endpoint. Clients that render a
 * whole workspace in one view (calendars, board views) request a few hundred
 * rows at once, so the cap sits above that rather than at a token 100. It is
 * still enforced — an over-large `limit` is rejected with 400, never silently
 * clamped, so a client is never told "here is everything" when it is not.
 */
export const MAX_PAGE_SIZE = 200;

export class PaginationDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: "Page number (1-based)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    description: `Items per page (max ${MAX_PAGE_SIZE})`,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
