import { GenderEnum } from './interfaces/movie.interface';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsMongoId,
  IsDateString,
  IsUrl,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
 
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()

  description: string;

  @ApiProperty({ example: '2022-10-24T15:04:14.322' })
  @IsNotEmpty()
  @IsDateString()
  releaseDate: Date;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
 // from 1 to 5 included
  rating: number;

  @IsEnum(GenderEnum)
  @IsNotEmpty()
  @ApiProperty({ enum: GenderEnum })
  gender: GenderEnum;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  actors: Array<string>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  poster: string;

}

export class UpdateMovieDto{
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ example: '2022-10-24T15:04:14.322' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  releaseDate?: Date;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
 // from 1 to 5 included
  rating?: number;

  @IsEnum(GenderEnum)
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ enum: GenderEnum })
  gender?: GenderEnum;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  actors?: Array<string>;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  poster?: string;

}


