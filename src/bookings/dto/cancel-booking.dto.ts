import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CancelBookingDto {
  @ApiPropertyOptional({ example: "Client cancelled the event" })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
