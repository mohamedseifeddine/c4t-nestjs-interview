import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role: Role;
}


export enum Role {
  Admin = 'admin',
  User = 'user',
}
