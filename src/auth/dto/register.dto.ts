import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Password123!", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    example: "John Studio",
    description: "Name of the workspace/business to create",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  workspaceName!: string;

  @ApiPropertyOptional({ example: "Photography Studio" })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ example: "+94771234567" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "studio@example.com" })
  @IsEmail()
  @IsOptional()
  workspaceEmail?: string;

  @ApiPropertyOptional({ example: "Colombo" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: "Wedding Photography" })
  @IsString()
  @IsOptional()
  mainServiceCategory?: string;
}
