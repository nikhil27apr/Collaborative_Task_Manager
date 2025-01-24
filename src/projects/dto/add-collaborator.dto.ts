import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AddCollaboratorDto {
  @IsNotEmpty()
  @IsString()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['admin', 'editor', 'viewer'])
  role: string;
}
