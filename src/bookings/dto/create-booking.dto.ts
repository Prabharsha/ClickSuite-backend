import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { IsAdvanceWithinTotal } from "../validators/advance-within-total.validator";
import { IsEndTimeAfterStartTime } from "../validators/end-time-after-start-time.validator";

/** 24-hour "HH:MM". Rejects "9:00", "99:99" and "18:00:00". */
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateBookingDto {
  @ApiProperty({
    example: "workspace-id",
    description: "Workspace the booking belongs to",
  })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: "Wedding Shoot - Kasun & Nethmi", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  bookingTitle!: string;

  @ApiProperty({ example: "Kasun Perera", maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clientName!: string;

  @ApiPropertyOptional({ example: "+94771234567", maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  clientPhone?: string;

  @ApiPropertyOptional({ example: "kasun@example.com" })
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional({ example: "Wedding", maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  eventType?: string;

  @ApiProperty({ example: "2026-08-15", description: "Event date (ISO 8601)" })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ example: "09:00", description: "24-hour HH:MM" })
  @IsString()
  @IsOptional()
  @Matches(HH_MM, { message: "startTime must be in HH:MM format" })
  startTime?: string;

  @ApiPropertyOptional({ example: "18:00", description: "24-hour HH:MM" })
  @IsString()
  @IsOptional()
  @Matches(HH_MM, { message: "endTime must be in HH:MM format" })
  @IsEndTimeAfterStartTime()
  endTime?: string;

  @ApiPropertyOptional({ example: "Colombo", maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: "Full Wedding Coverage", maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
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

  @ApiPropertyOptional({ example: "Outdoor wedding event", maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
