import { IsString, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional() // Optional because it can be blank
  description?: string;
}

export class UpdateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
