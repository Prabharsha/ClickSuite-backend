import { ApiProperty } from "@nestjs/swagger";
import { WorkProgressStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateWorkProgressDto {
  @ApiProperty({
    enum: WorkProgressStatus,
    example: WorkProgressStatus.EDITING,
  })
  @IsEnum(WorkProgressStatus)
  workProgressStatus!: WorkProgressStatus;
}
