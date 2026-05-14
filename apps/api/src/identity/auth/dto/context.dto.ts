import { IsUUID } from 'class-validator';

export class SelectContextDto {
  @IsUUID()
  company_id!: string;
}
