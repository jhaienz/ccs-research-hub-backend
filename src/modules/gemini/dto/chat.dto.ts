import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatDto {
  @ApiProperty({ example: 'How many papers are pending review?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
