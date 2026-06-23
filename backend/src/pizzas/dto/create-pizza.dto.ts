import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePizzaDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  price25: number;

  @IsNumber()
  price30: number;

  @IsNumber()
  price35: number;

  @IsNumber()
  categoryId: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isHit?: boolean;
}
