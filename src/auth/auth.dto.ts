import { CreateUserDto } from '../user/user.dto';
import { Validate, IsEmail, IsNotEmpty, IsString ,MinLength} from 'class-validator';
import { ValidPasswordFormat } from '../validation/CustomPassword';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserWithEmailAndPasswordDto extends CreateUserDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password is too short',
  })
  @IsNotEmpty()

  @Validate(ValidPasswordFormat, {
    message: 'Password must have one uppercase, one lowercase, one number, one special character!',
  })
  @ApiProperty()
  password: string;
}

export class LoginWithEmailAndPasswordDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
