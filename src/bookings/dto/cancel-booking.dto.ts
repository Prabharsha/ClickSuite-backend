import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CancelBookingDto {
  /**
   * Required: a cancellation with no stated reason leaves nobody able to
   * explain it later, and the UI asks for one before it sends the request.
   * Trimmed first, so a reason of spaces is no reason at all.
   */
  @ApiProperty({ example: "Client cancelled the event", maxLength: 500 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
