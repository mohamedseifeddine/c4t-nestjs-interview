import { GenderEnum } from './interfaces/movie.interface';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsUrl,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Title is too short',
  })
  @MaxLength(120, {
    message: 'Title is too long',
  })
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message: 'Description is too short',
  })
  @MaxLength(500, {
    message: 'Description is too long',
  })
  description: string;

  @ApiProperty({ example: '2022-10-24T15:04:14.322' })
  @IsNotEmpty()
  @IsDateString()
  releaseDate: Date;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1,{
    message: 'Rating value must be from 1 to 5',
  })
  @Max(5,{
    message: 'Rating value must be from 1 to 5 ',
  })
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
  @MinLength(2, {
    message: 'Title is too short',
  })
  @MaxLength(120, {
    message: 'Title is too long',
  })
  title?: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message: 'Description is too short',
  })
  @MaxLength(500, {
    message: 'Description is too long',
  })
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
  @Min(1,{
    message: 'Rating value must be from 1 to 5',
  })
  @Max(5,{
    message: 'Rating value must be from 1 to 5 ',
  })
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


