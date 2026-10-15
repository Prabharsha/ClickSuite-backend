import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  BookingStatus,
  PaymentStatus,
  WorkProgressStatus,
} from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class BookingQueryDto extends PaginationDto {
  @ApiProperty({
    description: "Workspace to list bookings from (required)",
  })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: "Filter by booking status",
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: "Filter by payment status",
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: WorkProgressStatus,
    description: "Filter by work progress status",
  })
  @IsEnum(WorkProgressStatus)
  @IsOptional()
  workProgressStatus?: WorkProgressStatus;

  @ApiPropertyOptional({
    example: "2026-08-15",
    description: "Filter by exact event date",
  })
  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @ApiPropertyOptional({
    description:
      "Free-text search across title, client name/phone/email, location and event type",
  })
  @IsString()
  @IsOptional()
  search?: string;
}
