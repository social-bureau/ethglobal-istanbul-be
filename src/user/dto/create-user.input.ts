import { IsEmail, IsMobilePhone, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from '../models/role.enum';

export class CreateUserInput {
  @IsOptional()
  profileName: string;

  @IsOptional()
  @IsMobilePhone()
  mobilePhone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  firstname: string;

  @IsOptional()
  lastname: string;

  @IsOptional()
  profileImage: string;

  @IsNotEmpty()
  role: Role;
}
