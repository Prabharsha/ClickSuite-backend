import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

/**
 * Editable booking fields. workspaceId and the status fields are intentionally
 * excluded — those move through the dedicated status / work-progress / cancel
 * endpoints. Cross-field validation (advance <= total) is enforced in the
 * service after merging with the persisted values.
 */
export class UpdateBookingDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  bookingTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiPropertyOptional({ example: "2026-08-15" })
  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @ApiPropertyOptional({ example: "09:00" })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: "18:00" })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packageName?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
