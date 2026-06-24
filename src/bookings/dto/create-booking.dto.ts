import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
import { IsAdvanceWithinTotal } from "../validators/advance-within-total.validator";

export class CreateBookingDto {
  @ApiProperty({
    example: "workspace-id",
    description: "Workspace the booking belongs to",
  })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: "Wedding Shoot - Kasun & Nethmi" })
  @IsString()
  @IsNotEmpty()
  bookingTitle!: string;

  @ApiProperty({ example: "Kasun Perera" })
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @ApiPropertyOptional({ example: "+94771234567" })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({ example: "kasun@example.com" })
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional({ example: "Wedding" })
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiProperty({ example: "2026-08-15", description: "Event date (ISO 8601)" })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ example: "09:00" })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: "18:00" })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: "Colombo" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: "Full Wedding Coverage" })
  @IsString()
  @IsOptional()
  packageName?: string;

  @ApiProperty({ example: 250000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsAdvanceWithinTotal()
  totalAmount!: number;

  @ApiPropertyOptional({ example: 50000, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional({ example: "Outdoor wedding event" })
  @IsString()
  @IsOptional()
  notes?: string;
}
