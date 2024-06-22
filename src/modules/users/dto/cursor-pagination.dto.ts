import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { CursorPaginationInterface } from "../interfaces/cursor-pagination.interface";

export class CursorPaginationDto implements CursorPaginationInterface {
  @ApiProperty({ required: false, description: "Cursor for pagination" })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ required: false, description: "Number of items per page", default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}